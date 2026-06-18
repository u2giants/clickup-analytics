// Saved Views + per-user view preferences.
//
// Extends pm_saved_view (sidebar "views": Space=department > Master + views)
// and adds pm_view_pref so a SHARED view can be reordered / recolored / hidden
// per-user without mutating the shared record.
//
// pm_saved_view new fields (managed by the app):
//   visibility  string  'personal' | 'shared'   (default 'personal')
//   origin      string  'user' | 'clickup_list' (default 'user'; seeded list views)
//   color       string  base title hex color (seeded list views share one color)
//   sort_order  integer owner's default order (per-user override in pm_view_pref)
//
// pm_view_pref (NEW) — one row per (user, view):
//   user (m2o directus_users), view (m2o pm_saved_view, CASCADE),
//   sort_order (int), color (string), hidden (bool, default false)
//
// Permissions: pm_saved_view today has wildcard CRUD (fields ["*"], no row
// filter) across N policies; per-user scoping is done in the frontend query.
// We mirror that exact pattern onto pm_view_pref (same policies, wildcard CRUD).
// The 4 new pm_saved_view fields are already covered by the existing ["*"].
//
// Note: a composite unique (user, view) cannot be created via the field API
// (single-field only). Uniqueness is enforced in app logic (read-then-upsert).
//
// Additive/idempotent and safe to re-run.
//
// Usage:
//   POPPIM_ENV_FILE=/home/ai/.directus-deploy.env \
//   DX_URL=https://data.designflow.app \
//   node pm-system/add-saved-views-model.mjs
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

async function login() {
  TOKEN = (await api('POST', '/auth/login', { email: EMAIL, password: PASSWORD })).access_token
}

// ── field defs ────────────────────────────────────────────────────────────────
const string = { type: 'string', meta: { interface: 'input' }, schema: {} }
const integer = { type: 'integer', meta: { interface: 'input' }, schema: {} }
const boolean = { type: 'boolean', meta: { interface: 'boolean' }, schema: { default_value: false } }
const m2o = { type: 'uuid', meta: { interface: 'select-dropdown-m2o', special: ['m2o'] }, schema: {} }
const visibility = { type: 'string', schema: { default_value: 'personal' }, meta: { interface: 'select-dropdown', options: { choices: [{ text: 'Personal', value: 'personal' }, { text: 'Shared', value: 'shared' }] } } }
const origin = { type: 'string', schema: { default_value: 'user' }, meta: { interface: 'input', note: "'user' or 'clickup_list'" } }

const PK = { field: 'id', type: 'uuid', schema: { is_primary_key: true, has_auto_increment: false }, meta: { hidden: true, readonly: true, interface: 'input', special: ['uuid'] } }

const PM_SAVED_VIEW_FIELDS = [
  ['visibility', visibility],
  ['origin', origin],
  ['color', string],
  ['sort_order', integer],
]

const PM_VIEW_PREF_FIELDS = [
  ['user', m2o],
  ['view', m2o],
  ['sort_order', integer],
  ['color', string],
  ['hidden', boolean],
]

// ── ensure helpers ────────────────────────────────────────────────────────────
async function fieldsOf(collection) {
  return new Set((await api('GET', `/fields/${collection}`)).map((f) => f.field))
}

async function ensureField(collection, field, def, existing) {
  if (existing.has(field)) { console.log(`  = ${collection}.${field} (exists)`); return }
  await api('POST', `/fields/${collection}`, { field, ...def })
  existing.add(field)
  console.log(`  + ${collection}.${field}`)
}

async function ensureCollection(collection, icon, note) {
  const all = new Set((await api('GET', '/collections')).map((c) => c.collection))
  if (all.has(collection)) { console.log(`  = collection ${collection} (exists)`); return }
  await api('POST', '/collections', { collection, schema: {}, meta: { icon, note }, fields: [PK] })
  console.log(`  + collection ${collection}`)
}

async function ensureRelation(collection, field, related, onDelete) {
  const rels = new Set((await api('GET', '/relations')).map((r) => `${r.collection}.${r.field}`))
  if (rels.has(`${collection}.${field}`)) { console.log(`  = relation ${collection}.${field} (exists)`); return }
  await api('POST', '/relations', { collection, field, related_collection: related, schema: { on_delete: onDelete }, meta: {} })
  console.log(`  ~ ${collection}.${field} -> ${related} (on delete ${onDelete})`)
}

// Mirror pm_saved_view's policy grants onto the target collection: same policies,
// same actions, wildcard fields, no row filter (frontend scopes per-user).
async function mirrorPermissions(sourceCollection, targetCollection) {
  const srcPerms = await api('GET', `/permissions?filter[collection][_eq]=${sourceCollection}&limit=-1&fields=id,policy,action,fields,permissions,validation,presets`)
  const tgtPerms = await api('GET', `/permissions?filter[collection][_eq]=${targetCollection}&limit=-1&fields=id,policy,action`)
  const have = new Set(tgtPerms.map((p) => `${p.policy}:${p.action}`))
  let created = 0
  for (const p of srcPerms) {
    if (!p.policy) continue // skip admin/public app-access rows without a policy id
    const key = `${p.policy}:${p.action}`
    if (have.has(key)) continue
    await api('POST', '/permissions', {
      policy: p.policy,
      collection: targetCollection,
      action: p.action,
      fields: p.fields ?? ['*'],
      permissions: p.permissions ?? {},
      validation: p.validation ?? {},
      presets: p.presets ?? null,
    })
    have.add(key)
    created++
  }
  console.log(`  perms ${targetCollection}: +${created} (mirrored from ${sourceCollection})`)
}

async function main() {
  await login()

  console.log('Extending pm_saved_view...')
  const svFields = await fieldsOf('pm_saved_view')
  for (const [f, def] of PM_SAVED_VIEW_FIELDS) await ensureField('pm_saved_view', f, def, svFields)

  console.log('Creating pm_view_pref...')
  await ensureCollection('pm_view_pref', 'tune', 'Per-user overrides (order/color/hidden) for saved views')
  const prefFields = await fieldsOf('pm_view_pref')
  for (const [f, def] of PM_VIEW_PREF_FIELDS) await ensureField('pm_view_pref', f, def, prefFields)
  await ensureRelation('pm_view_pref', 'user', 'directus_users', 'CASCADE')
  await ensureRelation('pm_view_pref', 'view', 'pm_saved_view', 'CASCADE')

  console.log('Mirroring permissions...')
  await mirrorPermissions('pm_saved_view', 'pm_view_pref')

  console.log('Done. Additive; no Directus restart needed (no Flow changes).')
}

main().catch((e) => { console.error(e); process.exit(1) })
