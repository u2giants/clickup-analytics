#!/usr/bin/env python3
"""Owner: Oracle control census. Fixed GET-only metadata probe; never a Worker call."""
import hashlib,json,math,os,re,sys,urllib.error,urllib.request
from datetime import datetime,timezone
from pathlib import Path

ACCOUNT='8303d11002766bf1cc36bf2f07ba6f20'
WORKER='plane-integrations'
BASE='https://api.cloudflare.com/client/v4/accounts/'+ACCOUNT+'/workers/scripts/'+WORKER
NAMES=('OPENROUTER_API_KEY','QUERY_SECRET','CLICKUP_WEBHOOK_SECRET')
LIMIT=1024*1024
UUID=re.compile(r'[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}')
HASH=re.compile(r'[0-9a-f]{64}')

class ProbeDenied(Exception):pass
class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self,*args,**kwargs):raise ProbeDenied('redirect_refused')

def get(suffix,token,versions=frozenset()):
    if suffix not in {'/settings','/deployments'} and not (suffix.startswith('/versions/') and suffix[10:] in versions and UUID.fullmatch(suffix[10:])):
        raise ProbeDenied('endpoint_refused')
    request=urllib.request.Request(BASE+suffix,headers={'Authorization':'Bearer '+token,'Accept':'application/json'},method='GET')
    try:
        with urllib.request.build_opener(NoRedirect).open(request,timeout=15) as response:
            if response.status!=200:raise ProbeDenied('http_status_'+str(response.status))
            raw=response.read(LIMIT+1)
    except urllib.error.HTTPError as e:raise ProbeDenied('http_status_'+str(e.code)) from None
    except (urllib.error.URLError,TimeoutError):raise ProbeDenied('transport_unavailable') from None
    if len(raw)>LIMIT:raise ProbeDenied('response_bound_exceeded')
    try:document=json.loads(raw)
    except (ValueError,UnicodeError):raise ProbeDenied('invalid_json') from None
    if not isinstance(document,dict) or document.get('success') is not True or not isinstance(document.get('result'),dict):raise ProbeDenied('invalid_envelope')
    return document['result']

def timestamp(value):
    if not isinstance(value,str) or len(value)>40:return None
    try:
        parsed=datetime.fromisoformat(value.replace('Z','+00:00'))
        if parsed.tzinfo is None:return None
        return parsed.astimezone(timezone.utc).isoformat()
    except ValueError:return None

def flags(bindings):
    found={name:False for name in NAMES}
    if isinstance(bindings,list):items=[(item.get('name'),item) for item in bindings if isinstance(item,dict)]
    elif isinstance(bindings,dict):items=list(bindings.items())
    else:raise ProbeDenied('invalid_bindings_metadata')
    if len(items)>200:raise ProbeDenied('binding_count_bound')
    for name,binding in items:
        if name in found and isinstance(binding,dict) and binding.get('type')=='secret_text':found[name]=True
    return found

def active(result):
    deployments=result.get('deployments')
    if not isinstance(deployments,list) or not deployments or not isinstance(deployments[0],dict):raise ProbeDenied('missing_active_deployment')
    latest=deployments[0];identifier=latest.get('id');versions=latest.get('versions')
    if not isinstance(identifier,str) or not UUID.fullmatch(identifier) or not isinstance(versions,list) or not 1<=len(versions)<=2:raise ProbeDenied('invalid_active_deployment')
    parsed=[]
    for version in versions:
        if not isinstance(version,dict):raise ProbeDenied('invalid_active_version')
        vid,percentage=version.get('version_id'),version.get('percentage')
        if not isinstance(vid,str) or not UUID.fullmatch(vid) or type(percentage) not in (int,float) or not math.isfinite(percentage) or not 0<percentage<=100:raise ProbeDenied('invalid_active_version')
        parsed.append({'version_id':vid,'percentage':percentage})
    if len({v['version_id'] for v in parsed})!=len(parsed) or sum(v['percentage'] for v in parsed)!=100:raise ProbeDenied('invalid_traffic_distribution')
    return {'deployment_id':identifier,'created_on':timestamp(latest.get('created_on')),'versions':parsed}

def collect(env):
    result={'schema_version':1,'read_only':True,'paid_calls':0,'worker':WORKER,'observed_at':datetime.now(timezone.utc).isoformat(),
            'github_secret_fingerprints':{name:{'present':bool(env.get(name)),'sha256':hashlib.sha256(env[name].encode()).hexdigest() if env.get(name) else None} for name in NAMES},
            'live_worker_key_fingerprint':'UNKNOWN','github_to_live_secret_association':'UNKNOWN'}
    sha=env.get('GITHUB_SHA','')
    if re.fullmatch('[0-9a-f]{40}',sha):result['repository_commit']=sha
    source=Path(__file__).resolve().parents[1]/'integrations/worker/src/index.js'
    result['repository_worker_source_sha256']=hashlib.sha256(source.read_bytes()).hexdigest()
    token=env.get('CLOUDFLARE_API_TOKEN')
    if not token:
        result['metadata_status']='existing_cloudflare_token_missing'
        return result
    try:
        settings=get('/settings',token);result['settings_secret_binding_names_present']=flags(settings.get('bindings'))
        deployment=active(get('/deployments',token));allowed=frozenset(v['version_id'] for v in deployment['versions'])
        projected=[]
        for item in deployment['versions']:
            version=get('/versions/'+item['version_id'],token,allowed)
            if version.get('id')!=item['version_id']:raise ProbeDenied('version_identity_mismatch')
            metadata=version.get('metadata',{});resources=version.get('resources',{})
            if not isinstance(metadata,dict) or not isinstance(resources,dict):raise ProbeDenied('invalid_version_metadata')
            script=resources.get('script',{})
            if not isinstance(script,dict):raise ProbeDenied('invalid_script_metadata')
            etag=script.get('etag')
            projected.append({**item,'created_on':timestamp(metadata.get('created_on')),'modified_on':timestamp(metadata.get('modified_on')),
                              'worker_bundle_etag':etag if isinstance(etag,str) and HASH.fullmatch(etag) else None,
                              'secret_binding_names_present':flags(resources.get('bindings'))})
        if active(get('/deployments',token))!=deployment:raise ProbeDenied('active_deployment_changed')
        result['active_deployment']=deployment;result['active_versions']=projected
        result['metadata_status']='complete'
    except ProbeDenied as error:
        result['metadata_status']=str(error)
    return result

if __name__=='__main__':
    os.umask(0o077)
    try:
        result=collect(os.environ)
        destination=Path('oracle-control-provenance.json')
        with destination.open('x') as output:json.dump(result,output,indent=2);output.write('\n')
        print('Read-only fingerprints saved; live Worker key association remains UNKNOWN')
        if result.get('metadata_status')!='complete':
            print('Cloudflare metadata unavailable: '+result['metadata_status'],file=sys.stderr);raise SystemExit(1)
    except ProbeDenied as error:
        print('Read-only provenance refused: '+str(error),file=sys.stderr);raise SystemExit(1)
    except Exception:
        print('Read-only provenance refused: unexpected safe failure',file=sys.stderr);raise SystemExit(1)
