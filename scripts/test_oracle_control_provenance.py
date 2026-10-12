import hashlib,io,json,unittest,urllib.error
from unittest.mock import patch
import oracle_control_provenance as p

VID='11111111-1111-1111-1111-111111111111';DID='22222222-2222-2222-2222-222222222222'
def deployments():return {'deployments':[{'id':DID,'created_on':'2026-06-10T04:16:44Z','versions':[{'version_id':VID,'percentage':100}]}]}
def version():return {'id':VID,'metadata':{'created_on':'2026-06-10T04:16:44Z','author_email':'DO-NOT-EMIT','source':'USER-TEXT'},'resources':{'bindings':[{'name':'OPENROUTER_API_KEY','type':'secret_text','text':'DO-NOT-EMIT'}],'script':{'etag':'a'*64,'body':'DO-NOT-EMIT'}}}

class Proof(unittest.TestCase):
 def test_projection_discards_values_text_and_authors(self):
  env={'CLOUDFLARE_API_TOKEN':'invented-token','OPENROUTER_API_KEY':'invented-key','QUERY_SECRET':'invented-query','CLICKUP_WEBHOOK_SECRET':'invented-webhook','GITHUB_SHA':'b'*40}
  with patch.object(p,'get',side_effect=[{'bindings':[{'name':'QUERY_SECRET','type':'secret_text','text':'DO-NOT-EMIT'}]},deployments(),version(),deployments()]) as get:
   result=p.collect(env)
  encoded=json.dumps(result)
  for text in ('DO-NOT-EMIT','invented-token','invented-key','invented-query','invented-webhook','USER-TEXT'):self.assertNotIn(text,encoded)
  self.assertEqual(result['github_secret_fingerprints']['OPENROUTER_API_KEY']['sha256'],hashlib.sha256(b'invented-key').hexdigest())
  self.assertEqual(result['live_worker_key_fingerprint'],'UNKNOWN');self.assertEqual(result['metadata_status'],'complete')
  self.assertEqual([c.args[0] for c in get.call_args_list],['/settings','/deployments','/versions/'+VID,'/deployments'])
 def test_denied_cf_keeps_github_hash_and_unknown(self):
  with patch.object(p,'get',side_effect=p.ProbeDenied('http_status_403')):result=p.collect({'CLOUDFLARE_API_TOKEN':'invented','OPENROUTER_API_KEY':'invented-key'})
  self.assertEqual(result['metadata_status'],'http_status_403');self.assertEqual(result['live_worker_key_fingerprint'],'UNKNOWN');self.assertTrue(result['github_secret_fingerprints']['OPENROUTER_API_KEY']['sha256'])
 def test_race_is_unknown(self):
  changed=deployments();changed['deployments'][0]['id']='33333333-3333-3333-3333-333333333333'
  with patch.object(p,'get',side_effect=[{'bindings':[]},deployments(),version(),changed]):result=p.collect({'CLOUDFLARE_API_TOKEN':'invented'})
  self.assertEqual(result['metadata_status'],'active_deployment_changed');self.assertNotIn('active_versions',result)
 def test_no_arbitrary_endpoint_or_version_network(self):
  for suffix in ('/query','/secrets/OPENROUTER_API_KEY','/versions/'+VID,'/versions/../../query','https://evil.invalid'):
   with patch.object(p.urllib.request,'build_opener') as opener:
    with self.assertRaises(p.ProbeDenied):p.get(suffix,'invented-token')
    opener.assert_not_called()
 def test_request_is_get_bounded_and_no_redirect(self):
  class Response:
   status=200
   def __enter__(self):return self
   def __exit__(self,*args):pass
   def read(self,n):self.n=n;return b'{"success":true,"result":{}}'
  response=Response()
  with patch.object(p.urllib.request,'build_opener') as create:
   create.return_value.open.return_value=response;p.get('/settings','invented-token')
   request=create.return_value.open.call_args.args[0]
   self.assertEqual(request.method,'GET');self.assertEqual(request.full_url,p.BASE+'/settings');self.assertEqual(response.n,p.LIMIT+1)
  with self.assertRaises(p.ProbeDenied):p.NoRedirect().redirect_request(None,None,None,None,None,None)
 def test_oversized_and_invalid_response_fail_closed(self):
  class Response:
   status=200
   def __enter__(self):return self
   def __exit__(self,*args):pass
   def read(self,n):return b'x'*(p.LIMIT+1)
  with patch.object(p.urllib.request,'build_opener') as create:
   create.return_value.open.return_value=Response()
   with self.assertRaises(p.ProbeDenied):p.get('/settings','invented')
 def test_invalid_active_traffic_or_id_denied(self):
  for field,value in [('version_id','../settings'),('percentage',float('nan')),('percentage',0),('percentage',99)]:
   doc=deployments();doc['deployments'][0]['versions'][0][field]=value
   with self.assertRaises(p.ProbeDenied):p.active(doc)

if __name__=='__main__':unittest.main()
