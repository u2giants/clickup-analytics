// Backfill first-class ClickUp status fields from product.clickup_raw / project.clickup_raw.
//
// Usage:
//   POPPIM_ENV_FILE=/home/ai/.directus-deploy.env \
//   DX_URL=https://data.designflow.app \
//   node pm-system/migration/backfill-clickup-status-fields.mjs
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
const PAGE = Number(process.env.PAGE || 500)
let TOKEN = ''

async function dx(method, path, body) {
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
  TOKEN = ''
  TOKEN = (await dx('POST', '/auth/login', { email: EMAIL, password: PASSWORD })).access_token
}

async function backfill(collection) {
  let updated = 0
  for (let offset = 0;; offset += PAGE) {
    await login()
    const rows = await dx('GET', `/items/${collection}?filter[clickup_raw][_nnull]=true&fields=id,clickup_raw&limit=${PAGE}&offset=${offset}`)
    if (!rows.length) break
    for (const row of rows) {
      const status = row.clickup_raw?.status
      if (!status) continue
      await dx('PATCH', `/items/${collection}/${row.id}`, {
        clickup_parent_id: row.clickup_raw?.parent || null,
        clickup_top_level_parent_id: row.clickup_raw?.top_level_parent || null,
        clickup_status: status.status || null,
        clickup_status_type: status.type || null,
        clickup_status_color: status.color || null,
        clickup_status_order: status.orderindex ?? null,
      })
      updated++
    }
    console.log(`[${new Date().toISOString()}] ${collection} offset ${offset + rows.length}; updated ${updated}`)
    if (rows.length < PAGE) break
  }
  console.log(`[${new Date().toISOString()}] ${collection} done; updated ${updated}`)
}

await login()
await backfill('product')
await backfill('project')
