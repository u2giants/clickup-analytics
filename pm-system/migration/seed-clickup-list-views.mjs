// Seed one SHARED saved view per live ClickUp list, so the familiar boards
// exist as views on day one. All seeded views share a single "system" color so
// users can recognize imported views; each is per-user hideable (pm_view_pref).
//
// A seeded view is: { name: <list>, screen: 'pipeline', business_unit: <dept>,
//   filters_json: { listNames: [<list>] }, visibility: 'shared',
//   origin: 'clickup_list', color: SEED_COLOR, sort_order: <by count desc>,
//   user: <admin owner> }.
//
// Lists are discovered with the SAME filter the pipeline uses (top-level,
// open/custom, has stage) so seeded views match what the board shows. Empty
// lists are skipped. Idempotent: skips when an origin='clickup_list' view with
// the same name + business_unit already exists.
//
// DRY RUN BY DEFAULT. Set APPLY=1 to write.
//
// Usage:
//   POPPIM_ENV_FILE=/home/ai/.directus-deploy.env node pm-system/migration/seed-clickup-list-views.mjs
//   APPLY=1 POPPIM_ENV_FILE=/home/ai/.directus-deploy.env node pm-system/migration/seed-clickup-list-views.mjs
import { readFileSync } from 'node:fs'

if (process.env.POPPIM_ENV_FILE) {
  for (const line of readFileSync(process.env.POPPIM_ENV_FILE, 'utf8').split('\n')) {
    const s = line.trim(); if (!s || s.startsWith('#') || !s.includes('=')) continue
    const i = s.indexOf('='); const k = s.slice(0, i).trim(); let v = s.slice(i + 1).trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
    if (process.env[k] === undefined) process.env[k] = v
  }
}

const BASE = process.env.DX_URL || 'https://data.designflow.app'
const EMAIL = process.env.DX_ADMIN_EMAIL
const PASSWORD = process.env.DX_ADMIN_PASSWORD
const APPLY = process.env.APPLY === '1'
const SEED_COLOR = '#8C9BB5' // single distinct color for all imported list views
let TOKEN = ''

async function api(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(TOKEN ? { Authorization: 'Bearer ' + TOKEN } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text(); let json; try { json = text ? JSON.parse(text) : null } catch { json = text }
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status}: ${json?.errors?.[0]?.message || text}`)
  return json?.data ?? json
}
const login = async () => { TOKEN = (await api('POST', '/auth/login', { email: EMAIL, password: PASSWORD })).access_token }

// space name -> app department (matches src/domain/products/adapters.ts spaceToBusinessUnit)
function spaceToBusinessUnit(spaceName) {
  const v = (spaceName ?? '').trim().toLowerCase()
  if (v === 'pop creations' || v === 'pop' || v === 'licensed') return 'Licensed'
  if (v === 'spruce line' || v === 'spruce' || v === 'generic') return 'Generic'
  if (v === 'designflow' || v === 'software') return 'Software'
  return null
}

const PIPELINE_FILTER = {
  _and: [
    { stage: { _nnull: true } },
    { clickup_status_type: { _in: ['open', 'custom'] } },
    { clickup_parent_id: { _null: true } },
  ],
}

async function main() {
  await login()
  const me = await api('GET', '/users/me?fields=id,email')
  console.log(`${APPLY ? 'APPLY' : 'DRY RUN'} — owner ${me.email} (${me.id}), seed color ${SEED_COLOR}\n`)

  // Discover lists with counts, grouped by space + list.
  const rows = await api('GET',
    `/items/product?aggregate[count]=*&groupBy[]=clickup_space_name&groupBy[]=clickup_list_name&filter=${encodeURIComponent(JSON.stringify(PIPELINE_FILTER))}&limit=-1`)

  const lists = rows
    .filter((r) => r.clickup_list_name)
    .map((r) => ({
      spaceName: r.clickup_space_name,
      listName: r.clickup_list_name,
      businessUnit: spaceToBusinessUnit(r.clickup_space_name),
      count: parseInt(r.count ?? '0', 10),
    }))
    .filter((r) => r.businessUnit && r.count > 0)
    .sort((a, b) => b.count - a.count)

  // Existing seeded views (idempotency).
  const existing = await api('GET', `/items/pm_saved_view?filter=${encodeURIComponent(JSON.stringify({ origin: { _eq: 'clickup_list' } }))}&fields=id,name,business_unit&limit=-1`)
  const existKey = new Set(existing.map((v) => `${v.business_unit}::${v.name}`))

  // sort_order per department (count desc)
  const orderByDept = {}
  let created = 0, skipped = 0
  for (const l of lists) {
    const key = `${l.businessUnit}::${l.listName}`
    if (existKey.has(key)) { skipped++; continue }
    orderByDept[l.businessUnit] = (orderByDept[l.businessUnit] ?? 0) + 1
    const payload = {
      name: l.listName,
      screen: 'pipeline',
      business_unit: l.businessUnit,
      filters_json: { listNames: [l.listName] },
      visibility: 'shared',
      origin: 'clickup_list',
      color: SEED_COLOR,
      sort_order: orderByDept[l.businessUnit],
      is_default: false,
      user: me.id,
    }
    console.log(`  ${APPLY ? '+' : '·'} [${l.businessUnit}] ${l.listName}  (${l.count})`)
    if (APPLY) await api('POST', '/items/pm_saved_view', payload)
    created++
  }

  console.log(`\n${APPLY ? 'Created' : 'Would create'} ${created}; skipped ${skipped} existing. Total candidate lists: ${lists.length}.`)
  if (!APPLY) console.log('Re-run with APPLY=1 to write.')
}

main().catch((e) => { console.error(e); process.exit(1) })
