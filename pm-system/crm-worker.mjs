// CRM companion worker for Directus.
// Commands:
//   outlook-ingest  - poll Microsoft Graph and create/route crm_email_message rows
//   reroute         - re-evaluate unrouted crm_email_message rows
//
// ClickUp sync is intentionally omitted.
//
// Env:
//   POPPIM_ENV_FILE=/home/ai/.directus-deploy.env
//   DX_URL, DX_ADMIN_EMAIL, DX_ADMIN_PASSWORD
//   MS_TENANT_ID/MS_CLIENT_ID/MS_CLIENT_SECRET or AZURE_TENANT_ID/AZURE_CLIENT_ID/AZURE_CLIENT_SECRET
//   OUTLOOK_MAILBOX=adweck@popcre.com
//   OUTLOOK_GATED=true
import { readFileSync } from 'node:fs'

if (process.env.POPPIM_ENV_FILE) {
  for (const line of readFileSync(process.env.POPPIM_ENV_FILE, 'utf8').split('\n')) {
    const s = line.trim()
    if (!s || s.startsWith('#') || !s.includes('=')) continue
    const i = s.indexOf('=')
    const k = s.slice(0, i).trim()
    let v = s.slice(i + 1).trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
    if (process.env[k] === undefined) process.env[k] = v
  }
}

const DX = process.env.DX_URL || 'https://data.designflow.app'
const EMAIL = process.env.DX_ADMIN_EMAIL
const PASSWORD = process.env.DX_ADMIN_PASSWORD
const INTERNAL_DOMAIN = 'popcre.com'
const GRAPH_BASE = 'https://graph.microsoft.com/v1.0'
const LOGIN_BASE = 'https://login.microsoftonline.com'
const PAGE_SIZE = 50
const LOOKBACK_MINUTES = Number(process.env.OUTLOOK_LOOKBACK_MINUTES || 20)
let TOKEN = ''

const NOISE_DOMAINS = new Set([
  'gmail.com',
  'outlook.com',
  'hotmail.com',
  'yahoo.com',
  'clickup.com',
  'teams.mail.microsoft.com',
  'fireflies.ai',
  'sharepointonline.com',
  'avanan-mail.net',
])
const NOISE_PREFIXES = ['notification.', 'news.', 'nl.']
const PO_PATTERN = /\b([DS]\d{4})\b/gi

async function dx(method, path, body) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const res = await fetch(DX + path, {
        method,
        headers: { 'Content-Type': 'application/json', ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}) },
        body: body ? JSON.stringify(body) : undefined,
      })
      const text = await res.text()
      let json
      try { json = text ? JSON.parse(text) : null } catch { json = text }
      if (res.ok) return json?.data ?? json
      if (![429, 500, 502, 503, 504].includes(res.status) || attempt === 4) {
        throw new Error(`${method} ${path} -> ${res.status}: ${json?.errors?.[0]?.message || text}`)
      }
    } catch (error) {
      if (attempt === 4) throw error
    }
    await new Promise((resolve) => setTimeout(resolve, 1500 * (attempt + 1)))
  }
}

function domainOf(address) {
  return String(address || '').split('@')[1]?.toLowerCase() || ''
}

function isNoiseDomain(domain) {
  return NOISE_DOMAINS.has(domain) || NOISE_PREFIXES.some((prefix) => domain.startsWith(prefix))
}

function normalizeSubject(subject) {
  let s = subject || ''
  let prev
  do {
    prev = s
    s = s.replace(/^(回复:|回覆:|RE:|FW:|Fwd:)\s*/i, '').trim()
  } while (s !== prev)
  return s
}

function extractAddresses(text) {
  return [...new Set(String(text || '').match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g) || [])].map((x) => x.toLowerCase())
}

function extractPoNumbers(text) {
  return [...new Set((String(text || '').match(PO_PATTERN) || []).map((x) => x.toUpperCase()))]
}

function participantAddresses(message) {
  return [
    message.from?.emailAddress?.address,
    ...(message.toRecipients || []).map((r) => r.emailAddress?.address),
    ...(message.ccRecipients || []).map((r) => r.emailAddress?.address),
  ].filter(Boolean).map((x) => x.toLowerCase())
}

async function login() {
  if (!EMAIL || !PASSWORD) throw new Error('DX_ADMIN_EMAIL and DX_ADMIN_PASSWORD are required')
  TOKEN = (await dx('POST', '/auth/login', { email: EMAIL, password: PASSWORD })).access_token
}

async function readAll(collection, params = '') {
  const out = []
  let page = 1
  while (true) {
    const joiner = params ? '&' : ''
    const rows = await dx('GET', `/items/${collection}?${params}${joiner}limit=500&page=${page}`)
    out.push(...rows)
    if (rows.length < 500) break
    page += 1
  }
  return out
}

async function routeEmail({ subject, bodyText, addresses }) {
  const searchText = `${subject || ''} ${bodyText || ''}`
  const normalizedSubject = normalizeSubject(subject).toLowerCase()
  const domains = [...new Set(addresses.map(domainOf).filter((d) => d && d !== INTERNAL_DOMAIN))]
  const nonNoiseDomains = domains.filter((d) => !isNoiseDomain(d))

  const ignoreRules = await readAll('crm_ignore_rule', 'fields=id,pattern,match_type')
  for (const rule of ignoreRules) {
    const pattern = String(rule.pattern || '').toLowerCase()
    if (!pattern) continue
    const matchType = rule.match_type || 'CONTAINS'
    if (
      (matchType === 'EXACT' && normalizedSubject === pattern) ||
      (matchType === 'STARTS_WITH' && normalizedSubject.startsWith(pattern)) ||
      (matchType === 'CONTAINS' && normalizedSubject.includes(pattern))
    ) {
      return { routing_status: 'SKIPPED', routing_method: 'AUTO_SKIP' }
    }
  }

  const poNumbers = extractPoNumbers(searchText)
  for (const po of poNumbers) {
    const rows = await dx('GET', `/items/crm_opportunity?filter[production_po_number][_eq]=${encodeURIComponent(po)}&fields=id,retailer,department&limit=1`)
    if (rows[0]) {
      return { routing_status: 'ROUTED', routing_method: 'PO_NUMBER', opportunity: rows[0].id, retailer: rows[0].retailer, department: rows[0].department }
    }
  }

  let retailer = null
  for (const domain of nonNoiseDomains) {
    const rows = await dx('GET', `/items/retailer?filter[_or][0][domain][_contains]=${encodeURIComponent(domain)}&filter[_or][1][routing_aliases][_contains]=${encodeURIComponent(domain)}&filter[customer_status][_in]=ACTIVE_CUSTOMER,POTENTIAL_CUSTOMER&fields=id,name,customer_status&limit=10`)
    if (rows.length === 1) {
      retailer = rows[0].id
      break
    }
  }

  if (!retailer && bodyText) {
    const threadDomains = [...new Set(extractAddresses(bodyText).map(domainOf).filter((d) => d && d !== INTERNAL_DOMAIN && !isNoiseDomain(d)))]
    const matches = []
    for (const domain of threadDomains) {
      const rows = await dx('GET', `/items/retailer?filter[_or][0][domain][_contains]=${encodeURIComponent(domain)}&filter[_or][1][routing_aliases][_contains]=${encodeURIComponent(domain)}&filter[customer_status][_in]=ACTIVE_CUSTOMER,POTENTIAL_CUSTOMER&fields=id&limit=2`)
      for (const row of rows) if (!matches.includes(row.id)) matches.push(row.id)
    }
    if (matches.length === 1) retailer = matches[0]
  }

  let department = null
  if (retailer) {
    const people = await dx('GET', `/items/buyer?filter[retailer][_eq]=${encodeURIComponent(retailer)}&filter[email][_in]=${addresses.map(encodeURIComponent).join(',')}&fields=id,department,scope&limit=50`)
    const deptIds = [...new Set(people.filter((p) => p.scope === 'DEPARTMENT' && p.department).map((p) => typeof p.department === 'string' ? p.department : p.department.id))]
    if (deptIds.length === 1) department = deptIds[0]
  }

  if (retailer && department) return { routing_status: 'COMPANY_DEPT', routing_method: 'EMAIL_DOMAIN', retailer, department }
  if (retailer) return { routing_status: 'COMPANY_ONLY', routing_method: 'EMAIL_DOMAIN', retailer }
  if (!nonNoiseDomains.length) return { routing_status: 'SKIPPED', routing_method: 'AUTO_SKIP' }
  return { routing_status: 'UNROUTED' }
}

async function graphToken() {
  const tenant = process.env.AZURE_TENANT_ID || process.env.MS_TENANT_ID
  const client = process.env.AZURE_CLIENT_ID || process.env.MS_CLIENT_ID
  const secret = process.env.AZURE_CLIENT_SECRET || process.env.MS_CLIENT_SECRET
  if (!tenant || !client || !secret) throw new Error('Missing Microsoft Graph credentials')
  const body = new URLSearchParams({ grant_type: 'client_credentials', client_id: client, client_secret: secret, scope: 'https://graph.microsoft.com/.default' })
  const res = await fetch(`${LOGIN_BASE}/${tenant}/oauth2/v2.0/token`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body })
  if (!res.ok) throw new Error(`Graph token failed: ${res.status} ${await res.text()}`)
  return (await res.json()).access_token
}

async function fetchRecentEmails(accessToken, mailbox) {
  const since = new Date(Date.now() - LOOKBACK_MINUTES * 60 * 1000).toISOString()
  const selectFields = ['id', 'subject', 'receivedDateTime', 'bodyPreview', 'body', 'from', 'toRecipients', 'ccRecipients', 'isRead'].join(',')
  const filterParam = `receivedDateTime ge ${since}`
  const url = `${GRAPH_BASE}/users/${encodeURIComponent(mailbox)}/messages?$filter=${encodeURIComponent(filterParam)}&$select=${selectFields}&$top=${PAGE_SIZE}&$orderby=${encodeURIComponent('receivedDateTime desc')}`
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } })
  if (!res.ok) throw new Error(`Graph messages failed: ${res.status} ${await res.text()}`)
  return (await res.json()).value || []
}

async function outlookIngest() {
  const mailbox = process.env.OUTLOOK_MAILBOX || 'adweck@popcre.com'
  const gated = process.env.OUTLOOK_GATED === 'true'
  const token = await graphToken()
  const messages = await fetchRecentEmails(token, mailbox)
  let created = 0
  for (const message of messages) {
    const existing = await dx('GET', `/items/crm_email_message?filter[outlook_message_id][_eq]=${encodeURIComponent(message.id)}&fields=id&limit=1`)
    if (existing.length) continue
    const addresses = participantAddresses(message)
    if (gated && !addresses.some((addr) => !addr.endsWith(`@${INTERNAL_DOMAIN}`))) continue
    const bodyText = message.body?.content || message.bodyPreview || ''
    const route = await routeEmail({ subject: message.subject || '', bodyText, addresses })
    await dx('POST', '/items/crm_email_message', {
      name: message.subject || '(no subject)',
      subject: message.subject || '(no subject)',
      sender: message.from?.emailAddress?.address || '',
      recipients: [...(message.toRecipients || []), ...(message.ccRecipients || [])].map((r) => r.emailAddress?.address).filter(Boolean).join(', '),
      received_at: message.receivedDateTime?.slice(0, 10),
      body_preview: message.bodyPreview || '',
      outlook_message_id: message.id,
      detected_po_numbers: extractPoNumbers(bodyText).join(', '),
      external_id: message.id,
      external_source: 'outlook',
      ...route,
    })
    created += 1
  }
  console.log(`outlook-ingest: ${created} created, ${messages.length} fetched`)
}

async function reroute() {
  const rows = await readAll('crm_email_message', 'filter[routing_status][_in]=UNROUTED,COMPANY_ONLY,COMPANY_DEPT&fields=id,subject,body_preview,sender,recipients')
  let updated = 0
  for (const row of rows) {
    const addresses = extractAddresses(`${row.sender || ''} ${row.recipients || ''}`)
    const route = await routeEmail({ subject: row.subject || '', bodyText: row.body_preview || '', addresses })
    await dx('PATCH', `/items/crm_email_message/${row.id}`, route)
    updated += 1
  }
  console.log(`reroute: ${updated} messages evaluated`)
}

await login()
const command = process.argv[2] || 'help'
if (command === 'outlook-ingest') await outlookIngest()
else if (command === 'reroute') await reroute()
else {
  console.log('Usage: node pm-system/crm-worker.mjs <outlook-ingest|reroute>')
}
