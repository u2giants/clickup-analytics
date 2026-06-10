# PM System Design — From ClickUp to a Tailored Directus System

**Purpose.** How the team uses **ClickUp** today, what's broken, and how the replacement is built on **Directus**. This is the requirements + feature-mapping doc; the concrete schema lives in **`data-model.md`**, the build approach in **`directus-execution-plan.md`**, and the **working, verified Phase-1 backend** in **`../pm-system/`**.

**Read first:** `business-process.md` (the business, no software) and `platform-decision-report.md` (why Directus, not Plane/Twenty). This doc uses the business vocabulary (offer/project, SKU, design collection, style number, licensing sheet, Brand Assurance, PI, PPS, on-shelf date).

**Two scopes, one platform.** Must serve **POP Creations** (licensed, heavyweight, Jessica + Liz) and **Spruce Line** (generic, lightweight, Jen) with their different data models — without forcing one line's process onto the other. Built by a **non-programmer + AI agents**, so the system is **configuration + Flows over custom code** (see `directus-execution-plan.md`).

---

# PART 1 — The Current System (ClickUp) and Why It's Being Replaced

## 1.1 How ClickUp is structured today

Everything runs in **ClickUp**, in three **Spaces**: **POP Creations** (licensed), **Spruce Line** (generic), **designflow** (internal dev — not product work). Within them, **Lists** mostly behave as **project/presentation/brief records with many child SKU tasks**. Key lists and scale (migration scope):

| List | Space | Records | Active | What it really is |
|---|---|---|---|---|
| Licensing Management | POP | 7,281 | ~8 | Primary SKU tracking for all licensed products |
| Edge Generic | Spruce | 701 | ~123 | Primary Spruce design tracking ("Edge" = old Spruce name) |
| Customer Refresh | POP | 264 | ~93 | Buyer-requested refreshes |
| Licensing Administration Tasks | POP | 236 | ~41 | Admin/coordination |
| New Prod Development | POP | 199 | ~26 | Internal new-product development |
| Freelancers Generic | Spruce | 111 | ~17 | **Dead** — failed experiment (do not model) |
| Customer Category Expansion | POP | 78 | ~12 | Buyer requests for new categories |
| General Presentations | Spruce | 48 | ~26 | Account-agnostic presentations for sales to self-serve |

**Parent/child is real and load-bearing:** Customer Refresh 264 parents / 2,446 children; Customer Category Expansion 78 / 428; New Prod Development 199 / 457; Licensing Management 7,281 / 4,280. **ClickUp flattens "offer/project" and "picked product/SKU" into one task type** — the #1 structural fact; the replacement models them as two things.

## 1.2 How each line uses ClickUp

**POP (Jessica/Liz):** work moves between **status columns** = the 17 pipeline stages; products carry a structured **SKU code** (`[FORMAT][SIZE][LICENSOR][PROPERTY][MATERIAL][##] …`, e.g. `GFZ80MVAV01 Marvel printed glass Avengers 8x10"`); **tags** carry most metadata (§1.3); custom fields (sample count, retailer, factory, put-up, category) are sparse.

**Spruce (Jen):** board organized **by lifecycle stage**, top priority "in development for a PO"; one task = one account project **or** a general dev project (title `ACCOUNT – BUYER – PROJECT TITLE – STATUS NOTES`); presentations are **dated PDFs** (date in title + filename); on buyer commit, items get a **style number**. Stage columns: Send Out Art for PO → Approved for Future Orders → Sample Received → Sample Requested → Price Requested/Buyer Approving → **Initial Approval/Selections Made** ("Int Approval" = *Initial*) → With Buyer for Approval → Waiting for Factory → In Work → Upcoming Projects → On Hold.

## 1.3 Tags — the de-facto metadata layer (POP), to convert to structured fields

- **Licensor/property:** `disney` (3,574), `marvel` (2,125), `wb` (1,208), `star wars` (1,095), `nick` (495), `nbcu` (491), `sega` (341), `peanuts` (272), `strawberry shortcake` (142), `one piece` (89), `coca cola` (50) → **Licensor** relation.
- **Channel/workflow:** `customer refresh` (1,516), `on po` (356), `customer category expansion` (182), `for licensor` (160), `prod development` (142), `internal approval` (133), `packaging submitted` (105), `packaging approved` (65), `stallion art wholesale only` (62), `iconick only` (5), `for factory` (39), `template` (33) → channel/milestone/flags.
- **Stale:** `for adam` (104) — outdated; **do not** carry forward.

## 1.4 Files, costing, off-system comms
- **Design files live on a Synology NAS** (path pasted in comments); a **DAM (PopDAM)** thumbnails them to DigitalOcean Spaces.
- **Costing/pricing in DesignFlow** (separate app; a named bottleneck).
- **Approvals/revisions happen in Teams + email** — the core **fragmentation** problem (truth scattered across ClickUp + Teams + email + NAS + DesignFlow).

## 1.5 What's structurally broken
Flat task model · designs get lost (no library) · no bulk ops · no time-in-stage/on-track · no formal cancel · no revision tracking · **no role-appropriate field visibility** (designers shouldn't see pricing) · scattered records · fragile adoption.

## 1.6 Current data realities (migration scope)
~9,069 products, ~300 active. Dormant pools: ~1,574 "Concept Approved" no PO/sample (reusable inventory), ~2,387 Pre-Production Approved, ~2,175 Production Approved. ~246 items open ~2.8 yrs (bulk-"Abandoned" on import). Sparse fields (`buyer` = opaque IDs; `product_category` 57/9,069; `retailer` ~200). Freelancers Generic = dead. PI on ~45/9,069 → three-state field. Keep the **Cloudflare Worker + D1** analytics/NL-query layer (re-point at Directus webhooks).

---

# PART 2 — Directus: what it gives you (and the little you build)

Detail in `directus-execution-plan.md`; in short, **out of the box (configuration, no code):** custom object types (collections) + **typed custom fields** + relations; custom workflow status (a select field, viewable as **Kanban**); **native field-level permissions** (the designers-vs-pricing requirement); saved per-role views; bulk edit; search/filter; S3/R2 file storage; REST + GraphQL + webhooks; **Flows** (no-code automation); and the **Data Studio** admin UI (used as the app in Phase 1). **You build on top, no fork:** custom UI via the Extensions SDK or an external React app (Phase 2); custom server logic via Hooks/Endpoints or external services; analytics/AI via the existing D1/Worker layer.

**The decisive fact:** every requirement below is **built-in or buildable-on-top without forking** — which Plane and Twenty could not both satisfy (see `platform-decision-report.md`).

---

# PART 3 — Feature spec, mapped to Directus mechanisms

Schema (collections/fields/relations/policies/Flows) is fully specified in **`data-model.md`** and **implemented + verified** in `../pm-system/`. Tags: **[Config]** = Data Studio setting; **[Flow]** = no-code automation; **[Ext]** = drop-in extension (Vue) or external React app; **[Svc]** = external service / existing D1 layer.

| # | Feature | Serves | Mechanism | Status |
|---|---|---|---|---|
| 1 | **Two-tier (POP) / three-tier (Spruce) model** | all | [Config] collections + Issue-Type-style `business_unit` + relations | ✅ built (`pm-system/`) |
| 2 | **Typed domain fields** (Brand Assurance, PI status, on-shelf/PPS dates, licensor, property, buyer, retailer, factory, cost target, style code) | all | [Config] fields — *native, no extension needed* | ✅ built |
| 3 | **Per-line workflow stages** (17 POP / 11 Spruce) | all | [Config] `stage` collection + Kanban layout | ✅ built (seeded) |
| 4 | **Field-level pricing visibility** (designers see specs, not pricing) | designers/sourcing | [Config] policy | ✅ built & verified |
| 5 | **Stage-history ledger** (time-in-stage foundation) | Jessica | [Flow] stage-change → `stage_history` | ✅ built & verified |
| 6 | **Design library + reuse** | Jessica, Jen, Adam | [Config] filtered View over `design`; one-click attach = small [Ext]/[Flow] | schema ready; view = next |
| 7 | **Cancel with required reason** | all | [Config] `closure_reason` + required-on-close; bulk-Abandoned on import | field built |
| 8 | **Bulk stage / designer changes** | Jessica | [Config] Data Studio multi-select edit (native) | native |
| 9 | **Time-in-stage / on-track / stuck & dormant alerts** | Jessica | [Flow]+[Svc] over `stage_history` + `product_type` SLA | foundation built |
| 10 | **Creative Director review queue + submission checklist** (Liz) & **Spruce PO-priority view** (Jen) | Liz, Jen | [Config] saved Views; checklist = simple collection/field | next |
| 11 | **Brand Assurance + PI handling** | licensing | [Config] fields + per-role policy (hidden from Liz) | fields built |
| 12 | **Multi-buyer conflict detection** | Jessica | [Flow]/[Svc] on `design`↔projects (needs M2M, Phase 1.x) | pending M2M |
| 13 | **Costing/constraint linkage** (specs to designers, pricing to sourcing/sales) | all | [Config] policy split + surface DesignFlow status | partial (policy built) |
| 14 | **Next-person notifications + incremental progress** | all | [Flow] on stage change → notify role | next |
| 15 | **Structured revision notes** | Liz, Jen | [Config] comments on the record | native |
| 16 | **Capacity / workload view** | Jessica | [Config] View grouped by assignee + [Svc] | next |
| 17 | **CSV export + bulk thumbnail download** | Jessica | [Config] export + [Svc] | native/ next |
| 18 | **Sales status view for Adam** | Adam | [Config] cross-line View | next |
| 19 | **Designer track-record analytics** | Liz | [Svc] existing D1 layer | next |
| 20 | **Proactive seasonal planner** & **AI assistant** | all | [Svc] D1/Worker NL layer over Directus data | next |

## 3.1 AI assistant — verbatim queries to support (via the D1/Worker NL layer)
**Jessica:** "How many SKUs have a licensing sheet but the art director hasn't sent it to the licensing team?" · "…tech packs for factory but no factory confirmed?" · "List of all projects for the same retailer." · "Which designer created more designs this week?" · "Which designer has the least picks last month?" · "Summary of this project" → counts + next action.
**Liz:** "Which designs were submitted to the licensor but no response in X days?" · "Which designer has the highest revision/rejection rate?"
**Jen:** "Actual timing to get pricing and samples?" · "Status of all sample requests at the factory." · "Build a design calendar from previous years."
**Operational:** approved-but-no-PO (the ~1,574) · licensor with most outstanding submissions · stuck 30+ days.

---

# PART 4 — Migration & Architecture

- **Migrate** active + recent + the reusable "Concept Approved" pool; **bulk-close** ancient items as `Abandoned`; **archive** Freelancers Generic + the designflow space; **preserve** every SKU/style code (immutable).
- **Backfill** structured fields from tags (licensor/channel) and resolve buyer IDs→names; drop `for adam`.
- **Import via the Directus API**, stamping every row with **`external_id` (the ClickUp id)** for traceability/re-sync. Source the data from the existing D1 denormalized copy. Order: reference collections → projects → products → designs → attachments.
- **Files:** Directus storage → **Cloudflare R2** for thumbnails/attachments; **full design files stay on NAS**; link via NAS path + DAM thumbnail URL.
- **Analytics/AI:** keep the **Cloudflare Worker + D1**; feed it **Directus webhooks** (replacing the ClickUp feed). Directus = system of record + workflow; D1 layer = reporting, SLA/alerts, designer track-record, the seasonal planner, and the NL assistant.
- **Hosting:** Directus + Postgres on **Coolify** (R2 storage, Microsoft Entra SSO via OIDC, OIG license key). See `../pm-system/docker-compose.yml`.

---

# PART 5 — Build status & roadmap

- **Phase 1 backend: ✅ BUILT & VERIFIED** — 14 collections, 26 relations, field-level pricing policy, stage-history Flow; deployable (`../pm-system/`). Use **Data Studio as the UI**.
- **Phase 1.x (next):** M2M relations (multi-buyer seam); the remaining Flows (dormant/SLA/notify); saved per-role Views (CD queue, Jen's PO view, Adam's status); ClickUp→Directus migration import.
- **Phase 2:** consolidate the **CRM** off the Twenty fork into the same Directus; optionally a bespoke **react-admin** UI for sales/designers.
- **Phase 3:** fold in the **DAM** data layer (keep the NAS/render/checkout agents; re-point at Directus).

---

# PART 6 — Design Principles & Traps to Avoid

**Principles:** (1) **One source of truth** — pull info *into* Directus, never add a sixth place. (2) **Two businesses, one platform** — configure per line. (3) **Support expertise, don't replace it** — Liz/Jen run on judgment. (4) **Make the easy path the correct path** — incremental updates, bulk actions, next-person nudges beat the workaround. (5) **Nothing gets lost.** (6) **Configuration + Flows over custom code** — the builder is a non-programmer + AI; keep the breakable surface small.

**Traps (documented wishes that are easy to get wrong):**
- **Don't force a checklist on Liz's *aesthetic review*** — but **do** give her a submission *tracking* checklist + one notes home.
- **Don't auto-validate everything** — **auto-check Pantones** specifically (her real everyday error).
- **Don't drop "assigned to me" views or color-coding.**
- **Don't rely on real-time discipline** — make incremental updates easy; show partial progress.
- **Don't model dead boards as live** (Freelancers Generic); **Spruce has no licensor pipeline.**
- **Don't expose pricing to designers, or hide constraints from them** — the field-level split (already built & verified) is the point.
