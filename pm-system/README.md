# PM System — Directus backend (Phase 1)

This is a **working, verified** Phase-1 project-management backend for POP Creations + Spruce Line, built on **Directus**. It was built and tested end-to-end (against a local Directus on SQLite) on 2026-06-09. Deploy it on Postgres (Coolify) and you have a usable PM system in Data Studio — Kanban boards, field-level permissions, and the SLA time-in-stage ledger — with **zero custom front-end code**.

It implements the schema in `../docs/data-model.md` and the approach in `../docs/directus-execution-plan.md`.

## What's in here

| File | What it is |
|---|---|
| `docker-compose.yml` | Directus + Postgres, R2 storage + MS SSO env stubs. The deploy unit. |
| `.env.example` | Copy to `.env`, fill in (KEY/SECRET/ADMIN/DB/R2/SSO). |
| `apply-schema.mjs` | **The source of truth.** Creates all 14 collections, 26 relations, the Designer role/policy (pricing hidden), and the stage-history Flow — via the Directus API. Idempotent. |
| `seed-and-verify.mjs` | Seeds demo data and asserts the 3 core proofs (below). Optional but recommended. |
| `schema-snapshot.yaml` | A `directus schema snapshot` of the data model (collections/fields/relations only — NOT flows/roles/policies; those live in `apply-schema.mjs`). Reference/diff aid. |

## What was built & VERIFIED (all assertions passed)

**14 business collections:** `retailer, buyer, licensor, property, factory, product_type, season, stage, design_collection, project, design, product, order, stage_history` — the unified POP (2-tier) + Spruce (3-tier) model.

1. **Relational graph resolves** — from a `product` you can traverse → project → buyer → retailer (3 hops), plus → licensor, property, factory, stage, and product_type (with its SLA minutes). The "one source of truth" graph works.
2. **Field-level permission (the make-or-break requirement)** — the **Designer** role reads all specs but **cannot see `cost_target` / `quoted_cost`** (pricing). Verified: designer's product record omits those fields entirely, an explicit request for `cost_target` is blocked, and admin can still see them. No other evaluated platform (Plane/Twenty/OpenProject/NocoDB) could do this without forking.
3. **Stage-history Flow (SLA foundation)** — changing a product's `stage` writes exactly one `stage_history` row (auto-timestamped, pointing to the new stage); a non-stage edit writes nothing. This is the ledger that time-in-stage / SLA / dormant alerts compute from.

## Deploy (Coolify)

1. `cp .env.example .env` and fill it in. Generate `KEY` and `SECRET`: `node -e "console.log(crypto.randomUUID())"` (run twice).
2. Add your **OIG `LICENSE_KEY`** (uncomment in `.env` and `docker-compose.yml`) to lift the Core caps (3 seats / 25 collections / 5 flows). Without it you'll hit the seat cap.
3. Deploy `docker-compose.yml` on Coolify (it'll manage Postgres, Caddy/SSL).
4. Apply the schema + config:
   ```bash
   DX_URL=https://pm.designflow.app DX_ADMIN_EMAIL=you@popcre.com DX_ADMIN_PASSWORD=*** node apply-schema.mjs
   ```
5. **Restart the Directus service** (the event-triggered Flow only registers at boot).
6. (Optional) verify: `DX_URL=... DX_ADMIN_EMAIL=... DX_ADMIN_PASSWORD=... node seed-and-verify.mjs` → expect `✅ ALL VERIFICATIONS PASSED`.
7. Configure **Microsoft SSO** (uncomment the AUTH_MICROSOFT_* block) — Microsoft + Google are config-only on Directus. (WeChat is NOT — it needs custom work; see `../docs/directus-execution-plan.md`.)

## Gotchas discovered while building (so you don't rediscover them)

- **Collections need `schema: {}`** in the create payload or Directus makes a *folder* (no table). `apply-schema.mjs` handles it.
- **Event-trigger Flow option is `collections` (plural)**, not `collection`. With the wrong key the Flow silently never fires.
- **Flows with event triggers only register at server startup** — after `apply-schema.mjs`, you MUST restart Directus once.
- **Timestamps:** there is no `{{$now}}` template. `stage_history.changed_at` uses the `date-created` special (auto-fills on insert) instead.

## Not yet built (Phase 1.x — next)

- **M2M relations** (project↔licensors/properties/product_types; design↔projects for full multi-buyer detection). Currently modeled as M2O. See `../docs/data-model.md` §3.4.
- The remaining **Flows** (dormant alert, SLA/stuck alert, multi-buyer conflict, next-person notification) — patterns in `data-model.md` §6.
- **Migration import** from ClickUp/D1 (`external_id` mapping) — `data-model.md` §7.
- The optional **bespoke React UI** (Phase 2; react-admin + `ra-directus`, since Refine's Directus connector is near-dormant). Data Studio is the UI until then.
