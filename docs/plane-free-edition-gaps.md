# What free, self-hosted Plane cannot do that we need

**Date:** 2026-06-09
**Question this answers:** Can we build the PM system Jen, Jessica, and Liz need on the **free, self-hosted (AGPL Community Edition) Plane** — ideally building our functionality *on top* without forking?

**Short answer: No.** The specific capabilities our workflow depends on are either (a) **paywalled behind Plane's closed-source Commercial Edition** (a separate, non-open binary unlocked with a paid per-seat license key — not something we can self-build from the public repo), (b) **impossible in any edition without forking** the monorepo, or (c) **not provided at all** and must be built as a fully separate external application against Plane's API.

This document lists, item by item, what the free edition cannot do that we require, with sources. It is a decision input — we are continuing to evaluate other options (notably **Twenty**, which we already run in production, and **Directus**).

> **Plane is open-core, not fully open-source.** The Community Edition is AGPL-3.0 and self-hostable, but it has feature parity with the *Free cloud tier only*. The data-model and governance features below live in a **closed-source Commercial Edition** delivered via a proprietary installer (`prime-cli`) and gated by plan (Pro / Business / Enterprise). There is **no `ee/` directory in the public GitHub repo** for these features — the code is not published.

---

## Our requirements vs. free Plane

Legend: ✅ in free CE · 💰 paid + **closed-source** Commercial Edition only · 🔒 **not possible without forking** · 🔧 must be **built as a separate external app**

| # | What we need | Free Plane CE? | Where it actually lives |
|---|---|---|---|
| 1 | **Custom object types** — Project/offer, SKU, Design Collection, Design, Style# as distinct types | 💰 | "Work Item Types" — **Pro/Business**, Commercial Edition only |
| 2 | **Typed custom fields** — Brand Assurance #, PI status (enum), on-shelf date, PPS date, licensor, property, buyer, retailer, factory, cost target, style #, costing constraints | 💰 | "Custom Properties" — **Pro**, Commercial Edition only. CE has **no** typed custom fields. |
| 3 | **Workflow rules + approval gates** — controlled stage transitions, who-can-move, licensor/CD/PO approval gates | 💰 | "Workflows" — **Business**; approvals — **Enterprise**. Commercial Edition only. |
| 4 | **3-tier hierarchy / Epics** — Collection → Project → Style#, and Project → SKU | 💰 / partial | Epics — **Pro**; and even then hierarchy is ~**2 levels**. Our 3-tier model isn't supported. |
| 5 | **Field-level permissions** — designers see manufacturing specs but **not** pricing | 🔒 | **No edition has this.** Permissions are action-level only (Admin/Member/Guest). Hiding a field by role requires modifying core source = a fork. |
| 6 | **A plugin/extension system** to embed our custom UI (design-library browser, our stage boards) and logic | 🔒 / 🔧 | **No plugin SDK exists.** Custom UI *inside* Plane ⇒ fork the Next.js monorepo. Otherwise build a **separate external app** on the API. |
| 7 | **Bulk stage / assignee / field changes** (Jessica's daily need) via API | 🔧 | Native bulk endpoints exist only for **delete / archive / date**. Bulk state/assignee/field must be built (loop the per-item API). |
| 8 | **Time-in-stage, on-track, SLA / stuck / dormant alerts** | 🔧 | No native feature. Must compute externally from the activity-log API + our SLA tables in a separate service. |
| 9 | **SSO (Microsoft Entra / SAML / OIDC), audit logs, advanced RBAC** | 💰 | **Business/Enterprise**, Commercial Edition only. (We already have Entra SSO on our Twenty instance for free.) |
| 10 | **Official SDK in our stack (TypeScript)** | partial | Only an official **Python** SDK exists; **no TS/JS SDK**. Our stack is TypeScript. |

### For balance — what the free CE *can* do (and we'd rely on)
Custom **states** (unlimited, per project), saved **views** (filter/group, kanban/list/calendar/etc.), global **search**, **REST API + webhooks** (HMAC-signed), **OAuth 2.0** apps, S3-compatible file storage (works with **R2**), cycles, modules, pages, comments, and an **activity log** we could read for transition history. These are real and useful — but they are the *substrate*, not the features above that our workflow actually hinges on.

---

## Why this fails our "build 100% on top without forking" rule

Three independent blockers, any one of which is decisive:

1. **The data model is paywalled and closed.** Custom Types + Custom Properties + Workflows are the backbone of our system (every domain field and every pipeline). In free CE they don't exist; to get them we must run the **closed-source Commercial Edition** and pay per seat — we cannot self-build them from source.
2. **Field-level visibility is impossible without a fork.** "Designers see specs, not pricing" (a real requirement from the interviews) has no configuration path in *any* Plane edition. It requires patching core code.
3. **There is no extension model for our custom UI.** Our flagship features — the searchable **design library**, our custom **stage boards**, **time-in-stage** badges, **multi-buyer conflict** alerts — cannot be embedded in Plane. We'd build them as a **separate app** against the API (so Plane isn't really "the system" — it's a backend), or fork the monorepo (the thing we wanted to avoid).

**Net:** to adopt Plane we would have to **(a)** pay for the closed Commercial Edition (Pro $7 / Business $17 per seat/mo at time of writing) to get types/fields/workflows, **(b)** still build all custom UI and logic as a separate external application, **and (c)** still fork the core for field-level field visibility. That combination does not satisfy "build 100% on top of the free version without forking."

---

## Sources

- Editions & versions (CE = Free-tier parity; Commercial Edition is separate/closed): https://developers.plane.so/self-hosting/editions-and-versions
- Plane editions blog (Commercial Edition is closed-source, license-key gated): https://plane.so/blog/plane-and-its-editions
- Open-source page (CE vs Commercial feature split): https://plane.so/open-source
- Custom Properties / Work Item Types (Pro): https://developers.plane.so/api-reference/issue-types/properties/update-property and https://docs.plane.so/core-concepts/issues/epics
- Workflows / approvals (Business/Enterprise): https://docs.plane.so/workflows-and-approvals/workflows
- Roles & permissions matrix (no field-level): https://docs.plane.so/roles-and-permissions/permissions-matrix
- Bulk ops (UI only; no general bulk API): https://docs.plane.so/core-concepts/issues/bulk-ops
- API reference + webhooks + OAuth: https://developers.plane.so/api-reference/introduction and https://developers.plane.so/dev-tools/intro-webhooks
- Official Python SDK (no TS/JS SDK): https://github.com/makeplane/plane-python-sdk
- Prime CLI (Commercial-only installer): https://developers.plane.so/self-hosting/manage/prime-cli
- License (AGPL-3.0 CE): https://github.com/makeplane/plane/blob/master/LICENSE.txt

*Note: exact paid-tier pricing and the precise CE↔Commercial feature line can shift between releases — verify against the live editions page before any decision.*
