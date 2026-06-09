# Interview Synthesis — POP Creations & Spruce Line PM System

**Last updated:** 2026-06-09
**Sources:** 77 answered interview questions across 4 rounds (May 5 – June 9, 2026), cross-referenced against live D1 data analysis (`BUSINESS_INTELLIGENCE.md`).
**Interviewees:**
- **Jessica Cortázar** — Project Manager, POP Creations (licensed line). 30 answers, Rounds 1, 2 & 3.
- **Liz (Elizabeth) Parkin** — Creative Director, POP Creations. 12 answers, Rounds 2 & 3.
- **Jennifer (Jen) Chaffier** — Creative Director, Spruce Line (generic/non-licensed line). 37 answers, Round 4 (completed June 9).

**Status:** All interviews complete. Every open question from prior rounds is resolved.

---

## How to read this document

**Audience:** an AI session tasked with designing and building the replacement project management system — a Plane-based platform that must perfectly fit how this company actually works and eliminate the specific friction these three people described.

**This document is self-contained.** Every data table needed to build the system (SLA targets, licensor turnaround times, the pipeline stages, the team) is reproduced here, not cross-referenced. Where a quote is load-bearing, it is verbatim and attributed by person and question number (e.g., *Jessica Q11*). Raw answers live in D1 `interview_questions`; the data analysis lives in `BUSINESS_INTELLIGENCE.md`.

**The company runs two parallel businesses** with a shared cast of people but fundamentally different processes:
- **POP Creations** — licensed home decor (75% of sales). Heavyweight: every design needs licensor approval. Run by Jessica (PM) + Liz (Creative Director).
- **Spruce Line** — generic/original home decor (25% of sales), formerly branded "Edge." Lightweight: no licensor, buyer approval only. Run by Jen (Creative Director).

The system must serve both without forcing one's process onto the other. Part II covers POP, Part III covers Spruce, Part IV covers what they share, and Part V is the build specification.

---

# PART I — ORIENTATION

## 1. What the company does

Designs and sources licensed and generic **home decor** products — wall art, framed/stretched canvas, plaques, storage, floor coverings (coir mats), garden, tabletop, clocks, photo frames, desk accessories — manufactured in China and imported to the US for sale to major retail chains.

**Retailers (buyers):** Burlington, TJX family (HomeGoods, Marshalls, TJ Maxx), Ross, Hobby Lobby, Walmart, Dollar General, Amazon, Hot Topic, Box Lunch, Kohl's, Five Below, At Home, Costco, DD's, Ollies, and others.

**Licensors (POP only):** Disney, Marvel, Star Wars (LucasFilm), Warner Bros, DC Comics, NBCUniversal, Paramount/Nickelodeon, Peanuts, SEGA, Strawberry Shortcake (WildBrain CPLP), WWE, One Piece (TOEI), Care Bears, Coca-Cola, Sesame Street.

## 2. Three sales channels

| Channel | Description | Approval path |
|---|---|---|
| **A — Major retail chains** (primary) | Direct sales to mass retailers. Each sale is a "project" — an offer to one buyer at one retailer for one season. | Full POP pipeline (or Spruce pipeline for generic) |
| **B — Wholesale sublicensors** (secondary) | Online sellers (**Stallion Art**, **Iconick**) buy the product and resell under their own brand but sublicense the IP. | Same POP licensor pipeline. Tagged `stallion art wholesale only`, `iconick only`. **Liz finds these the hardest** — see §11.6. |
| **C — Internal / new product development** | Products built proactively without a specific buyer, then presented. | Standard pipeline, entered earlier |

## 3. Three ways work starts (POP)

1. **Customer request** — a buyer asks sales for a product type, format, or refresh; sales relays the brief to Jessica.
2. **Internal line refresh** — the company proactively refreshes a line (new designs, new licensors/properties, category expansion) and presents afterward.
3. **New product development** — the team develops a new format/category into a full concept before seeking buyer interest.

Idea sources Jessica named (*Jessica Q2*): a shopping trip to a retailer the client (or the company) wants to be in, an offer from a factory, internet inspiration, or a remix of existing product formats the company already has.

## 4. The full cast (both business units)

### POP Creations team (from *Jessica Q4* + live event log)

| Role | Person(s) | Owns |
|---|---|---|
| **Project Manager** | Jessica Cortázar | Whole POP pipeline; allocates designers across projects; currently advances most non-licensing stages manually |
| **Creative Director** | Liz Parkin | Approves all preliminary designs **and** licensing sheets — the internal gate before anything goes external; critiques art, coaches designers, helps PM assign work by designer strength |
| **Sales** | Adam | Talks to all buyers, sends preliminary concepts, relays licensor change requests, converts picks into orders. **Serves both POP and Spruce.** |
| **Technical Lead Designer** | Umamaheswararao (Uma) Meka | Audits all technical design work; manages factory communication; sends/updates files to factories |
| **Technical Designers** | (team) | Costing sheets, licensing sheets, tech packs for factory, packaging designs, review professional photos |
| **Creative Senior Designer** | (e.g. Ilona) | Advises creative team on product restrictions and materials |
| **Creative Designers** | (team) | Preliminary concepts for buyers, art files for picks, SKU descriptions |
| **Sourcing Managers** | Albert + China Team | Review costing sheets, find factories, obtain die lines, confirm construction/material details |
| **Licensing Manager / Coordinator** | (team) | Submit concepts/packaging to licensor portals, download licensor assets, record submission numbers |
| **Production Managers** | (team) | Production phase; request Brand Assurance form for shipping |
| **Factories (China)** | (partners) | Receive tech packs, produce PPS samples, run mass production |

**Note on "Sarbani":** the previous Creative Director (left ~2 years ago). A formal `sarbani_approval` checkpoint still exists in the data. Liz has assumed that function — see §10.3.

### Spruce Line team (from *Jen Q60*)

| Role | Person | Owns |
|---|---|---|
| **Creative Director** | Jen Chaffier | Approves all art/tech packs/samples; handles buyers; manages factory relationships; head product designer and trend collections; **the primary mover of every task** |
| **Senior Designer** | Mal | Manages factory relationships; approves files/tech packs/samples; designs art; suggests new themes; makes initial tech packs for new concepts; **handles sample-request approvals** |
| **Designer** | Vie | AI designs and theme concepts; training on new product development |
| **Junior Designer** | Nat | Designs art; **pre-screens AI art** (removes poor quality / obvious AI mistakes before Jen reviews); preps art files for the tech team |

**Shared across both lines:** Adam (sales), Albert + China Team (costing/factory), Yuchen (factory deadline emails), Ilona (follow-up on third-party approvals), and **DesignFlow** (the separate costing/pricing software).

---

# PART II — POP CREATIONS (LICENSED LINE)

*Source: Jessica (PM) and Liz (Creative Director).*

## 5. The two objects the system must model

This is the single most important structural insight for POP, stated verbatim by Jessica (*Q7*) and corroborated by the live D1 parent/child data.

**Project Card** = one offer to one buyer at one retailer for one season.
- Examples (*Jessica Q7*): "Julie Greer at Burlington for Valentines 2027"; "Alice Zhu at Dollar General for Fall Winter 2026."
- Fields: buyer name, retailer, season, licensor(s), properties requested, product types requested, on-shelf date, PPS-requested date, restrictions.
- **Why it exists:** the style guides used to source design assets must be accurate for the on-shelf date (licensors date-gate their style guides), and each buyer purchases specific product types and specific properties within each license. All of this lives on the card as a **brief** so the creative designer can refer to it during the process and doesn't have to memorize it.
- Created whenever sales presents concepts to a buyer.

**SKU Card** = one product a buyer picked from a presentation, linked to its project card.
- Carries: full approval history (design → production), linkage to the project brief, licensor submission numbers, sample photos, NAS file paths, SKU description (material, size, artwork description — written by the creative designer who made the preliminary design).
- Must display **order history**: which retailers ordered it and when.

**D1 evidence for the hierarchy** (this is real, not theoretical):
- `Customer Refresh`: 264 parent cards / 2,446 child tasks
- `Customer Category Expansion`: 78 parent / 428 child
- `New Prod Development`: 199 parent / 457 child
- `Licensing Management`: 7,281 parent / 4,280 child

ClickUp flattens these into one task type. **The replacement must model Project and SKU as distinct first-class objects, with SKU → Project linkage mandatory.**

**Critical gap (the #1 pain point — see §7):** preliminary designs that are NOT picked must also be stored. Today they generate no SKU card and are lost.

## 6. SKU creation and lifecycle

### When a SKU is created (*Jessica Q56*)

A SKU exists to submit something to a licensor's system — **you cannot submit without one.** So a child SKU is created by any event that requires licensor approval:
- A buyer's official pick from a presentation
- A new development the company proactively wants to offer
- A factory proposal the company wants evaluated
- Any concept going to a licensor for approval

The **SKU code is the identifier linked to the licensor's approval record** and must be immutable once created.

### The SKU code format

```
[FORMAT][SIZE][LICENSOR][PROPERTY][MATERIAL][##]  [description + dimensions]
```
Examples: `GFZ80MVAV01 Marvel printed glass Avengers high render group on yellow A logo 8x10"` · `MTC3ADYPN02 Disney MDF die-cut block Groovy Princess Tiana 3x4"`

### When a SKU is closed (*Jessica Q37*)

A SKU should be marked **canceled with a mandatory closure reason** when:
- The factory quote does not meet the company's cost target → **Canceled: cost**
- The product is not under contract with the licensor → **Canceled: licensing**
- A manufacturing problem was found during sampling (construction impossible, too difficult, or too expensive) → **Canceled: sampling**
- The buyer declined and there is no other buyer interest → **Canceled: buyer**
- Reached Production Approved → **Completed** (the happy path)

**Current gap:** no formal cancel action exists. Products sit open indefinitely — some 4–5 years (D1 shows 246 products averaging 1,011 days / 2.8 years at "SKU Created"). **Every SKU must require a closure type before it can be closed**, and a one-time migration will need to bulk-close the ancient open ones with a best-guess or "Abandoned" reason.

### The 1,574 dormant "Concept Approved" products (*Jessica Q36*)

These are licensor-approved concepts with no PO and no sample request. Reasons they stalled: buyer passed on price, production time didn't fit, or the order was canceled. **They are not dead — they are inventory.** They should surface in the design library (§7) as *available-to-offer*, not hidden and not closed.

## 7. The design inventory problem (THE most critical feature)

**The verbatim problem (*Jessica Q6, Q8*):**
> "We manage a large number of projects simultaneously, with very tight deadlines. This leaves no time to organize what 'wasn't chosen' from each preliminary design presentation. We typically only focus on what was selected. Designs that are lost are lost several times a week. We've tried to reuse these designs for other projects to avoid starting from scratch. But this involves manually searching through past presentations and manually moving those files, which only exist there, to another location."

**The verbatim requirement (*Jessica Q8*):**
> "We need to be able to search according to project requirements: license, license property, product type, and season."

**What the system must do.** Designs must live **independently of the buyer presentation they were created for.** Every preliminary design — picked or not — is a first-class object with:
- Licensor + property
- Product type
- Season
- Retailer (where it was first offered)
- Thumbnail (the existing DAM thumbnails NAS files → DigitalOcean Spaces; integrate these, keep full files on NAS)
- Link to the project(s) it appeared in
- Status: picked / unpicked / offered-to-multiple-buyers

Any PM or salesperson must be able to browse every design ever created, filter by any combination of the above, and **attach one to a new project in a single action.**

**The proactive-sales extension (*Jessica Q51*):**
> "Project management should be proactive, not reactive… Instead of waiting for a buyer to request products for next year's Valentine's Day or Christmas and then scrambling, we should have offered the products beforehand."

The company already knows its seasons — **Valentine's, Easter, Graduation, Back to School, Harvest, Halloween, Christmas, plus Everyday** — and has history of which buyers order them and how often. The system should let her query: *season + product type → approved-but-unsold concepts AND unpicked preliminary designs → generate a deck to offer.* This is a query on the design library, not a new workflow.

## 8. Multi-buyer conflict

**What happens today (*Jessica Q9*):** when she receives buyer picks she passes them to the creative designer who made the preliminaries (to write the SKU description and prepare art files for the technical designer). She or the creative designer **notices manually** when two buyers picked the same design. The workaround: create a second version with minor changes (icons, image sizes, colors, embellishments) and have sales present the variation to one buyer — without explaining the real reason.

**Requirement:** detect the collision **the moment both projects select the same design**, and alert — before either version is half-built.

## 9. SKU reuse across buyers (*Jessica Q57*)

- Most licensors allow selling a product to multiple buyers over time; **some buyers prohibit resale** of what they bought — this restriction must be trackable per-licensor or per-buyer-agreement.
- There's a **time constraint** on re-offering the same product.
- Reuse happens case-by-case today only because there's no system for it ("only occasionally… if we've created it before for someone else, we look for it").
- The **SKU code must be preserved** (it's the licensor approval record). The SKU card should display the full **order history** of which retailers ordered it and when.

## 10. The licensor process

### What the licensor reviews and approves (*Jessica Q3, Q5*)

To move from Concept to Design, first the concept must be **chosen for the buyer** and a **format** (material, size, specifications) picked **by the buyer**. Then the creative designer prepares art files; the technical designer uses them to build the **licensing sheet** and design the **packaging**; this documentation is submitted to the licensor portal.

The licensor reviews:
- Correct asset use — no mixing different style guides, no distortion, no modifying characters
- Use of color
- **Storytelling** in the design — no plain backgrounds, no unrelated assets mixed together
- Packaging design against guidelines
- **On-shelf date** — style guides have date windows for use

A concept is **approved** when the licensor returns it with no feedback or corrections. Then: licensor waits for **PPS (pre-production sample) photos** → gives PPS approval (sometimes physical samples are required) → mass production → licensing team manages forms → **pre-production approved** → **production approved**.

**Communication:** the licensing team (manager + coordinator) talks to the licensor. Packaging revisions are done by technical design; creative revisions by the creative designer. **Everything the licensing team submits is first approved by the Creative Director (Liz).**

### The full pipeline (verbatim from *Jessica Q10*)

| # | Stage | Owner | Notes / internal alias |
|---|---|---|---|
| 1 | Art files creation | Creative Designer | Artwork for the buyer's selected format |
| 2 | Licensing sheet creation | Technical Designer | LS + packaging from art files |
| 3 | Licensing sheet review | Creative Director (Liz) | **Internal gate** — nothing advances without her |
| 4 | Ready to submit | Liz → Licensing Team | Liz sends approved sheet to licensing |
| 5 | Concept submitted | Licensing Team | Submitted to licensor portal |
| 6 | Revisions | Creative + Technical Designer | Licensor rejected concept or packaging |
| 7 | Concept approved | — | Approved, no corrections |
| 8 | Concept approved **with changes** | Creative + Technical Designer | Approved but minor revisions required **before** sampling — a distinct, action-requiring state |
| 9 | PO received | Technical Designer | Buyer placed order; prep tech pack files |
| 10 | Sales requested sample | Technical Designer | No PO yet, but sales wants a sample to close the order |
| 11 | Sample requested | Factory | Tech packs sent to factory (entered from #9 **or** #10) |
| 12 | Sample received | Liz + Licensing Team | Factory sent PPS photos; internal review |
| 13 | Factory resample | Factory | Sample had errors; corrected and re-shot |
| 14 | Sample sent to licensor | Licensing Team | Internal alias "PPS submitted" |
| 15 | Sample revision | Creative + Technical Designer | Licensor sent sample changes |
| 16 | Pre-production approved | — | "PPS approved"; mass production authorized |
| 17 | Production approved | — | Submission closed |

**Two important nuances the stage list alone hides:**
- **#9 PO received and #10 Sales requested sample are parallel entry points into sampling.** Both lead to #11. The system must support both.
- **Production Approved requirements vary by licensor (*Jessica Q5*):** some require a product safety form (PI — see §10.2), some require the physical sample shipped to their office, some are satisfied with PPS approval. Closure conditions are per-licensor.

## 10.1 Checkpoint: Brand Assurance (*Jessica Q39*; Liz Q30 did not know it)

Brand Assurance is the **submission number** the licensor's portal generates whenever a new item is submitted. The licensing team:
1. Records the number in the system, linking each SKU to its Brand Assurance number.
2. Prints and saves the PDF of the submission.

It is needed **a second time at production:** the Production team requests the Brand Assurance form to print and paste on shipping boxes alongside the trademark authorization, for import. So it is both a submission record and a **shipping compliance document.**

**Implementation:** Brand Assurance number = a required field once a SKU reaches "Concept submitted." PDF attachable. A second instance needed at production time. *(Note: Liz had never heard of it — it lives entirely with the licensing team, which the role-scoped views must respect.)*

## 10.2 Checkpoint: PI / Product Integrity (*Jessica Q34*)

A **test report** certifying the materials used (and quantities) are non-toxic, non-hazardous, safe for the end customer. Some licensors require it; received via email; the licensing team submits it to the licensor.

**Why only 45 of ~9,069 products have it:** most licensors don't require it, and it isn't tracked consistently. Jessica isn't sure who owns it (thinks production team).

**Implementation:** a PI status field per SKU with three values — **Required / Not Required / Completed.** Default to "Not Required" for Spruce (generic) and for licensors that don't request it. Mark Required where the licensor mandates it (this per-licensor list needs to be documented).

## 10.3 Checkpoint: Sarbani Approval → rename (*Liz Q28*)

`sarbani_approval` maps to the previous Creative Director. Liz (now CD) performs the same function — reviewing licensing sheets and preliminary designs — but **without a formal named checkpoint.** She relies on 20 years of expertise (see §11). **Rename `sarbani_approval` → `creative_director_review`.**

## 11. Liz the Creative Director — how she actually works

Liz is the **internal bottleneck and the quality gate** simultaneously. Understanding her is essential because the system must *support* her judgment, not *replace* it with a checklist.

### 11.1 Her queue and rhythm (*Liz Q22*)
20+ licensing sheets a week, sometimes more. She checks in daily, splits the work across the week, and spends **~1 hour/day on submissions.**

### 11.2 Two distinct review processes (*Liz Q23, Q29*) — do not conflate them
- **Preliminary design review** = she's handed a **presentation for a retailer** and gives feedback. (Aesthetic / retailer-fit / will-the-licensor-approve judgment.)
- **Licensing sheet review** = she examines the **LS itself**: image → dimensions correct → how it's made → materials → **Pantones (all accounted for and correct)** → packaging. She submits if it's aesthetically right for the licensor's needs.

These are two different screens with two different information needs.

### 11.3 She uses expertise, not a process (*Liz Q28*)
> "From my 20 years experience I know what type of layout will sell or get approved by the licensor… I don't have a formal approval process. I just give my best evaluation."

She also checks colors, layout, licensor guidelines, and **brand/retailer fit** (extensive knowledge of which retailers want what). She manages day-to-day tasks and project management, **knows which designer is good at which product type, and discusses assignments with the PM.** *(This last point matters — see §13: she sometimes assigns work, which collides with Jessica's role.)*

### 11.4 The checklist nuance — she wants one, but only in the right place (*Liz Q53, Q54, Q55*)
This is subtle and was previously mis-stated. Liz does **not** want a checklist enforced on her **design-review judgment** (that's expertise). But she explicitly **asks for a checklist** to track **submissions**:
> "I would like a checklist… all the submissions being able to be checked off and submitted. If there is changes it's not communicated over Teams and gets lost. Right now all submissions that need licensor approval is just communicated via Teams. It's not formal and not tracked." (*Q54*)
> "It would keep all my notes organized and in one place. Maybe a check list and to do list in one place. Helpful for all designers to keep on task." (*Q53*)

**So:** give her a submission tracker / to-do checklist and a single place for notes. Do **not** gate her aesthetic review behind a forced rubric.

### 11.5 What she wants on every card (*Liz Q25, Q27*)
- **Specs and "the way a product is made"** — "the little details on each product type that take up the most time." This is her #1 wish.
- **Auto-check Pantones, not everything.** Templates already cut wrong-property errors way down. The real everyday problem is **missing Pantones or wrong colors written out.** Auto-validate that.

### 11.6 Wholesale sublicensors are her worst time-sink (*Liz Q33*)
Stallion Art and Iconick products **aren't designed by her team.** She has to give feedback to people she doesn't know who **don't understand licensing guidelines** — "incredibly difficult and time-consuming." The system should flag these and route/structure feedback for external designers.

### 11.7 Designer track record (*Liz Q26, Q31*)
Designers vary: some get the retailer aesthetic and know a licensor's rejection patterns; some don't. She wants to **see patterns** — which designers generate high revision rates / specific licensor rejections — to coach them. Useful, not blocking.

### 11.8 Feedback on the card vs. Teams (*Liz Q24, Q32*)
Today: Illustrator screenshot markups + Teams messages + occasional Teams calls + trend images for inspiration. Moving revision notes onto the card is, in her words, "just a different platform used… the same amount of steps." **Wishlist: one platform instead of multiple (*Q55*).** Net: structured in-card revision notes are fine, but the win is consolidation, not fewer clicks.

## 12. The Art Director bottleneck (most-corroborated finding)

The point where Liz reviews/approves licensing sheets before they go to the licensing team is the structural bottleneck. Five root causes (*Jessica Q11*):

1. **Volume** — sheets accumulate when Liz is busy with other responsibilities.
2. **Late design changes** — Liz sometimes changes artwork she already approved at the buyer-presentation stage, forcing the entire LS to be rebuilt.
3. **Product-type unfamiliarity** — she must consult senior creative, sales, production, or sourcing (China) before approving some product types, adding days.
4. **Color preferences** — colors the creative designer explicitly called out get rejected at LS stage for her preference.
5. **Property / packaging mismatch** — wrong property used (e.g., "Mickey and Friends" vs "Mickey Mouse"), or packaging done with the wrong property; the licensing team returns the sheet until corrected.

**What the system can fix:**
- Liz's real-time queue with time-in-stage per item (the AI query *Jessica* literally asked for: "How many SKUs have a licensing sheet but the art director hasn't sent it to the licensing team?")
- SLA alerts when an item sits in "Licensing sheet review" past the target for its product type (§14)
- Auto-validate licensor property against the style guide before submission (root cause #5)
- Pantone auto-check (Liz's everyday problem, §11.5)

**What the system cannot fix:** causes #2 (late design changes) and #3 (product-type unfamiliarity) are process/people problems, not data problems. Don't pretend otherwise.

## 13. Capacity & resource allocation — Jessica's actual core job

This is a through-line across *Jessica Q1, Q14, Q17, Q18, Q19* that the system must treat as a first-class concern, not an afterthought.

- Her daily question (*Q1, Q14*): "how to use the **Human Resources** available to deliver all the projects on time" — she opens custom boards, checks due dates, **adjusts which designers are on which projects**, and checks which SKUs have licensor revisions.
- **Surge bottlenecks (*Q19*):** real examples — a flood of **Hobby Lobby** simultaneous picks (creatives couldn't deliver art fast enough; some product types were new and unfamiliar; technical designers worked overtime; she pulled creatives off other projects; she had to send samples and submit them simultaneously *without* approvals to keep up). A huge **Ollies** order forced pausing other projects to prioritize tech packs.
- **What makes a product go perfectly (*Q18*):** good design with storytelling → fewer licensor reviews → faster approvals; clearly defined assets/style guidelines → easy packaging → fewer packaging revisions; and **both designers understanding the design constraints for the product type based on agreed factory costs.** Manufacturer limitations are sometimes known only to the art director, forcing revisions to die lines, color count, printing technique, and legal-line placement.

**Implication for the build:** the system needs a **capacity/workload view** (designer assignments, who's overloaded, what can be reallocated), surge visibility, and the costing-constraint linkage in §16 — because rework from unknown constraints is a recurring capacity drain.

## 14. SLA targets — reproduced in full (*Jessica Q16*)

These numbers drive every "stuck"/"on-track" alert. **Design-stage times depend on product type; licensor-stage times depend on the licensor.**

### Per-product-type design times (minutes)

| Product Type | Brief | Design | Art File | Licensing Sheet | Revisions | Techpack for Factory |
|---|---|---|---|---|---|---|
| Stretched/Box | 10 | 30 | 30 | 75 | 30 | 24 |
| Framed | 10 | 30 | 30 | 75 | 30 | 24 |
| Plaque | 10 | 30 | 30 | 75 | 30 | 24 |
| Functional | 20 | 30 | 60 | 150 | 60 | 48 |
| Other Wall | 20 | 30 | 30 | 75 | 30 | 24 |
| Block | 10 | 30 | 30 | 75 | 30 | 24 |
| Box | 10 | 30 | 30 | 75 | 30 | 24 |
| Photo Frames | 30 | 60 | 60 | 150 | 60 | 48 |
| Object | 30 | 60 | 30 | 75 | 30 | 24 |
| Other Tabletop | 20 | 60 | 30 | 75 | 30 | 24 |
| Clocks | 10 | 30 | 40 | 100 | 40 | 32 |
| Soft Storage | 30 | 60 | 40 | 100 | 40 | 32 |
| Hard Storage | 30 | 60 | 40 | 100 | 40 | 32 |
| Other Storage | 20 | 60 | 40 | 100 | 40 | 32 |
| Stationery Org | 30 | 60 | 40 | 100 | 40 | 32 |
| Desk Acc | 20 | 60 | 40 | 100 | 40 | 32 |
| Other Workspace | 20 | 60 | 40 | 100 | 40 | 32 |
| Floor Coverings | 10 | 15 | 20 | 50 | 20 | 16 |
| Garden | 30 | 30 | 40 | 100 | 40 | 32 |

### Per-licensor turnaround times

| Licensor | Expected response |
|---|---|
| Disney | 1–3 days |
| LucasFilm / Star Wars | 1–2 days |
| Marvel | 1–2 days |
| Nickelodeon (Paramount) | 3–6 days |
| Sesame Street | 4 days |
| Coca-Cola | 6 days |
| NBC Universal | 5–7 days |
| Warner Brothers | 5–10 days |
| Peanuts | 7–10 days |
| SEGA | 7–10 days |
| Strawberry Shortcake (WildBrain CPLP) | 7–10 days |
| WWE | 7–10 days |
| Care Bears | 7–10 days |
| One Piece (TOEI) | 7–15 days |

*Data note: D1 confirms SEGA is the most revision-heavy (avg 1.0 concept revisions — every product needed at least one); Marvel (0.43) and Peanuts (0.38) are above Disney (0.26) and Star Wars (0.19).*

## 15. Time-based visibility (*Jessica Q12, Q15, Q21*)

What Jessica wants on every SKU card, verbatim (*Q15*):
> "How long it has been in a certain status, how long ago its entire cycle began, and the deadline for it to change status so that the on-shelf date is met (retroactive planning based on the remaining stages and what we know they take)."

**Implementation:**
- `time_in_current_stage` — since last status change
- `total_cycle_age` — since SKU creation
- `projected_completion` — sum of SLA targets for all remaining stages (§14)
- `on_track` — will projected_completion land before the on-shelf date?
- **Stuck alert** — time_in_current_stage exceeds the product-type × stage SLA
- **Dormant alert** — reached "Concept Approved" but no PO and no sample after a defined wait (the 1,574 problem, §6)

**Two distinct dates, both required on the project/SKU (*Jessica Q21*):** the **on-shelf date** (when it must be in stores) and the **PPS-requested date** (when the buyer wants to see the sample — often weeks earlier). They drive different deadline math.

**Change-of-hands history (*Jessica Q21*):** when a different creative designer takes over a SKU, record who did what and when.

## 16. Costing sheet integration (*Jessica Q21, Q38, Q50*)

**Today:** technical designer creates the costing sheet (using internet references, shopping-trip photos, factory offers); the **art director approves it before** it goes to factories for quotes; the sourcing team reviews restrictions/construction/materials and **obtains the die lines.** The art director usually specifies restrictions but **sometimes forgets to share them with the creative team, or is unaware of them** — and the problem is discovered during sampling, causing rework.

Jessica tried to start a product library by product type documenting restrictions (with Merch Groups) so creatives could self-serve — **it's on hold/incomplete.**

**What they want:**
- Costing sheet **linked to the project** so designers see the specs — die lines, color count, printing technique, materials — **while designing**, removing the art director as a single point of information relay.
- **Role-based visibility:** sales and sourcing see full costing (RFQs/pricing); designers see only the constraint specs, **not pricing** (*Q50*).
- Verbatim (*Q50*): "It's much easier to connect and know what was costed and design precisely with those constraints, based on the product price the buyer agreed to."

## 17. Bulk operations & exports (*Jessica Q13, Q17, Q50*; Liz wishlist)

Hard requirements:
- **Bulk stage advancement** — "moving several SKUs from one stage to another, not just individual ones" (*Q17*).
- **Bulk designer assignment** — "select multiple SKUs and assign the licensing sheet to a technical designer within the same system, instead of manually accessing each SKU" (*Q13*).
- **Filter → CSV export** — filter by retailer + season + product type and download a CSV of all matching SKUs with field values (*Q50*).
- **Bulk thumbnail/mockup download** — download mockups for all SKUs in a filtered view at once (*Q50*).

## 18. Delegation, adoption & the update-discipline problem (*Jessica Q13, Q17, Q52*)

The goal state: each person advances their own stage when their work is done; the PM manages exceptions instead of moving every task.

**Why past attempts failed (*Q17*):** people complained they weren't tech-savvy, struggled with the system, forgot it, or found it disrupted their workflow, so the team gave up. For delegation to work the system needs to be:
- **Easy to understand and use** (the hard constraint)
- **Group actions** (not one-at-a-time)
- **History of who changed what and when**
- **Notify the next person in the chain** so work continues

**The batch-update fear (*Q17*):** "I'm worried the team will do everything locally and not upload until everything is finished. If they have 20 SKUs, I can't wait for them to create 20 art files. I want to know if they have the first 5, the first 10." → make **incremental updating the path of least resistance** (upload one file / advance one stage before starting the next), and **show partial progress within a batch.**

**The fragmentation problem (*Q52*):**
> "Information is very much in people's heads. Communication isn't this company's strong suit, and records of certain things are scattered everywhere: on ClickUp, in Teams, in emails. The system should allow notes or a history of information linked to projects, products, or SKUs. Many people don't understand the complete workflow… sometimes there are rework processes because the wrong person does the task."

**The role-collision problem (*Q52*):** "Another thing that slows me down a lot is that the art director sometimes assigns tasks and projects, when that's my role, which throws off my deadlines." → assignment authority should be clear in the system (PM owns scheduling/assignment; CD owns design quality). See §11.3 — Liz genuinely does help assign by designer strength, so this is a real tension to design around, not just a bug.

## 19. Data-hygiene facts that affect the build

- **"for adam" tag is outdated (*Jessica Q35*).** All client designs go to sales now; the tag is no longer meaningful. (But: presentations made for licensees/sublicensors do **not** go to sales.) Don't migrate the tag as a live routing signal.
- D1 field coverage is sparse (`buyer` stored as UUIDs not names; `product_category` populated on only 57 of 9,069; `retailer` on ~200). The new system must capture these as structured fields from day one.

---

# PART III — SPRUCE LINE (GENERIC / NON-LICENSED)

*Source: Jen (Creative Director). "Edge" was the previous brand name for Spruce Line — the names refer to the same operation (*Jen Q46*).*

## 20. The three-tier Spruce data model

Spruce does **not** map onto POP's two-tier model. Jen's own words define three distinct object types (*Q77, Q49, Q58, Q59*):

**Tier 1 — Design Collection (universal, account-agnostic).** A trend/art theme available to *all* accounts.
- Examples of organization (*Q58*): top-level sections = New Formats, Trend Boards, Garden, Floor Coverings, Storage, Seasonal, Wall Decor, Wall Art, General. Under each, specific **themes** — e.g. under Wall Art: Gaming, Farmhouse, Kitchen Art, Sneaker Art, Automotive, Global Culture, Brotivational, Bath, 420 Art, Neutral Nest, Chinoiserie Chic, African Animals, Florals, Animals, Soft Religion, Fashion, Sports, Abstracts, Coastal, Love Shack Fancy, Entertainment, Kids Art, Cowgirl Country.
- Can contain **hundreds of designs.** **High-res files are NOT delivered until a buyer requests them** (*Q77*).
- **No style numbers** — these are raw art assets, not products.
- Lives in the **General Presentations** board so Adam can self-serve (*Q42, Q58, Q63*). Version date is embedded in the task title *and* the filename so Adam always uses the latest (e.g. "Cowgirl Country - updated 6.11.25").
- **NOT in the searchable style-number library** (*Q77*) — too early, no commitment.

**Tier 2 — Project Card (account-specific).** One project for one buyer/account (*Q42, Q77*).
- Title format: **ACCOUNT – BUYER – PROJECT TITLE – STATUS NOTES**, e.g. "Forman Mills - Jennifer - Wall Art - SENT TO ADAM"; "Burlington - Anna - New Formats - PRICING IN DESIGNFLOW." (A general internal project reads "GENERAL DEVELOPMENT - New Small Wall Bodies".)
- Carries all presentations made during the project (dated PDFs), the brief, status, and subtasks assigned to individual designers.
- A **selections PDF** is created after each buyer meeting and lives on the project (*Q47, Q59*).

**Tier 3 — Style Number Record (production-committed).** Created when a buyer commits — selects designs and either places an order or (for sample accounts) requests a sample (*Q49, Q59, Q71*).
- The **style number** is the permanent identifier; **all files are searchable by it**, and art files are filed in the art library by theme (floral, abstracts, sports, etc.) (*Q49*).
- **The searchable library Jen wants = style-numbered items only**, not the raw collection art (*Q77*).
- "Art Sent for PO" **always** means a confirmed order; the task title is updated with order numbers once received (*Q71*).

**Two account patterns the system must support (*Q59*):**
- **Burlington (Anna), no samples:** meeting → selections PDF → buyer selects for a PO → *then* assign style number. (No sample step.)
- **Hobby Lobby (Kyle), samples required:** meeting → selections PDF → team internally picks size/format → buyer approves or requests changes → assign style numbers → **request samples.**
- Most Design Collections are **not** account-specific, **except all storage designs and all Hobby Lobby buyers** (*Q59*).

This is why Jen tracks everything **by product-lifecycle stage** rather than by buyer (*Q41, Q59*).

## 21. The Spruce stage map (*Jen Q41*)

Jen's board is ordered by lifecycle stage; her daily priority is the top field — art/product in development for a PO (*Q41*):

1. **Send Out Art for PO** — top priority; confirmed orders awaiting final files
2. **Approved for Future Orders** — buyer approved, no PO yet
3. **Sample Received**
4. **Sample Requested**
5. **Price Requested / Buyer Approving** — in DesignFlow pricing + buyer review
6. **Initial Approval / Selections Made** — note: shows as "Int Approval" in ClickUp; this is **Initial** Approval, *not* "Internal" (*Q61*)
7. **With Buyer for Approval** — the graveyard; items sit here weeks/months (*Q69*)
8. **Waiting for Factory**
9. **In Work**
10. **Upcoming Projects**
11. **On Hold**

*(D1's "Internal Approval" label for Spruce was a misread of "Int Approval." Correct it.)*

## 22. Spruce approval & production flow (*Jen Q43, Q44, Q65, Q68*)

1. Jen finalizes the presentation → sends to **Adam**, who presents to the buyer.
2. Adam gets buyer's art-change requests → relays to Jen.
3. Buyer approves the final presentation and commits → **style number assigned.**
4. Design makes a **costing tech pack for DesignFlow** → **Albert + China Team** handle factory selection and costing → **Adam reviews and approves costing** (*Q65*).
5. **Jen + Mal** review artwork and tech packs.
6. **Jen handles PO review** for accuracy (noted "as up week June 8th" — a current, possibly temporary, ownership detail) (*Q44*).
7. **Mal handles sample-request approvals** (*Q44*).
8. For a PO: the team **waits for Yuchen's email** with the factory deadline, then sends/preps files (*Q68*).

**No licensor step anywhere.** The entire POP licensor pipeline is absent.

## 23. Spruce briefs, revisions, timelines (*Jen Q66, Q67, Q68*)

- **Briefs — general designs:** two meetings/month (one art, one product). Jen sends a **meeting recap with who-works-on-what**; designers raise issues on Teams.
- **Briefs — account designs:** Jen sends a **project request via email**, placed as a **subtask on ClickUp** assigned to the designer; issues on Teams. Briefs are not formal documents — verbal + email + recap.
- **Revisions:** small changes → Teams; bigger → marked-up file or detailed email. Designers return fixes via email or Teams. **No formal revision tracking** (same gap as POP).
- **Timelines:** the design team does **not** track order timelines. The hard date is **Yuchen's factory-deadline email.** Burlington often places POs last-minute, leaving little prep time. Sample timelines: Adam sets them if possible.

## 24. Spruce cancellation, reuse, cross-line (*Jen Q69, Q72, Q70*)

- **Cancellation:** most common cause is the buyer not moving forward; items languish in "With Buyer for Approval." **Adam + Jen review the full list quarterly** and remove stalled projects. No formal cancel state (same gap as POP).
- **Reuse:** Design Collections are reused across all accounts by design — that's their purpose. Style-numbered products belong to specific buyers; no multi-buyer reuse-tracking needed at that tier (unlike POP).
- **Cross-line:** the two lines **share product development but not art** (*Q72*).
- **Reactive vs. proactive (*Q70*):** sometimes a buyer asks for a specific theme they don't already have art for (e.g. "Bears with Sweaters"); most often the buyer reviews existing themes and selects.

## 25. Spruce seasons & DesignFlow (*Jen Q64, Q65, Q73*)

- **Seasonal rhythm is account-specific**, not the POP calendar. Hobby Lobby has a dated calendar; Burlington requests verbally at meetings. The team **updates seasonal presentations starting with Hobby Lobby**, then adapts from there.
- **DesignFlow** is the separate pricing/costing software (its own ClickUp space exists) managed by Albert. It is a **named bottleneck:** when DesignFlow isn't working or pricing isn't updated, buyer approvals stall. Jen's worst recent bottleneck (*Q73*) was **Burlington Storage Bodies** stuck a week because DesignFlow pricing wasn't updated — she chased Albert repeatedly. (Her other bottleneck: **Hobby Lobby Ford samples** stuck on a third-party approval, which Ilona chased daily.)

## 26. Spruce pain points & wishlist (*Jen Q45, Q48, Q74*)

- **#1 pain (*Q45*):** "Having to chase down information or remind people to complete their part of the product lifecycle." Plus factories not being transparent about their capabilities, or **changing pricing in the pricing stage in ways not revealed until samples are already requested.**
- **Wishlist (*Q48*):** (a) **all team members on one system, consistently** — "would make everything more organized"; (b) **a way to generate a list for Adam on the exact status of all projects** so he can self-answer his questions.
- **Best case (*Q74*):** Ollies — the buyer buys everything he selects, works only in canvas, pricing already exists, and he's communicative. (The model of a frictionless account: existing pricing + committed buyer + single format.)

## 27. The freelancers list (*Jen Q62*)

"Freelancers Generic" (≈111 products in D1) is a **failed tracking project.** It was meant to track new art from multiple freelancers, managed by Jessica, but freelance needs were inconsistent and it became overwhelming. Many designs were moved in-house and the freelancer pool was culled to those usable across multiple projects. **Do not model this as a live pipeline** — it's a dead board.

## 28. Jen's AI assistant queries (verbatim, *Q75*)

1. "Track the **actual timing** to get pricing and samples" (she adds: this shouldn't fall on the design team alone).
2. "Status of **all sample requests at the factory**."
3. "Help **build a design calendar based on project timing from previous years** (try to get us out ahead of design requests)."

---

# PART IV — CROSS-CUTTING TRUTHS

## 29. Where the two lines converge (build once, serve both)

| Theme | POP (Jessica/Liz) | Spruce (Jen) | Shared system need |
|---|---|---|---|
| **One platform** | "one platform instead of multiple" (Liz Q55) | "all team members using the same system" (Q48) | Consolidate ClickUp + Teams + email + shared server into one source of truth |
| **Proactive seasonal planning** | season + product type → unsold concepts → decks (Q51) | design calendar from prior-year timing (Q75) | A seasonal planning view driven by history |
| **Dormant / stalled work** | 1,574 "Concept Approved" with no PO; 4–5yr open items | "With Buyer for Approval" graveyard; quarterly cull | Formal cancel state + dormant alerts + quarterly review tooling |
| **Scattered records / chasing people** | info "in people's heads," records scattered (Q52) | "chasing down information or reminding people" (Q45) | Notes/history on every object + next-person notifications |
| **No revision tracking** | Teams + Illustrator markups (Liz Q24) | Teams + marked-up files (Q67) | Structured in-card revision notes |
| **File storage by identifier** | SKU code → NAS path | style number → NAS art library by theme | Identifier-keyed file linkage + DAM thumbnails |
| **Status report for Adam (sales)** | "list of all projects for the same retailer" (Q20) | "generate a list for Adam on exact status of all projects" (Q48) | A sales-facing project status view |
| **Costing constraints surfacing late** | art director forgets to share constraints (Q38) | factory pricing changes hidden until sampling (Q45) | Costing/constraint visibility upstream of design |

## 30. Where they diverge (don't force one model on the other)

| | POP Creations | Spruce Line |
|---|---|---|
| Object model | **2-tier**: Project → SKU | **3-tier**: Design Collection → Project → Style Number |
| Approval gate | Licensor (external) + Liz (internal) | Buyer (external) + Jen/Mal (internal) — no licensor |
| Unit of execution | SKU (created to enable licensor submission) | Style Number (created on buyer commitment) |
| Searchable library | every preliminary design, picked or not | **only** style-numbered items (raw collection art excluded) |
| Multi-buyer reuse | tracked; SKU code preserved; resale restrictions per buyer | not tracked at product tier; collections reused by design |
| Seasonal calendar | fixed retail seasons | account-specific (Hobby Lobby leads) |
| Compliance docs | Brand Assurance, PI per licensor | none |

## 31. What the system must NOT do

- **Don't enforce a checklist on Liz's *aesthetic review.*** She uses 20 years of expertise (Q28). *But do give her a submission **tracking** checklist and a single notes home (Q53/Q54) — different thing.*
- **Don't auto-validate everything.** Templates already fixed most wrong-property errors; over-validation adds friction. **Auto-check Pantones** specifically (Liz Q25).
- **Don't drop "assigned to me" views or color-coding** — both are important and must carry over from ClickUp (Jessica Q50).
- **Don't rely on real-time discipline.** People batch-update; make incremental updates the easy path and show partial progress (Jessica Q17).
- **Don't model the Freelancers Generic board as live** — it's dead (Jen Q62).
- **Don't treat the POP licensor pipeline as universal** — Spruce has none.

---

# PART V — BUILD SPECIFICATION

## 32. Unified data model

```
                 ┌─────────────────────────────────────────────┐
                 │           DESIGN LIBRARY (search)           │
                 │  POP: every preliminary design (picked/not) │
                 │  Spruce: every style-numbered item          │
                 │  filter: licensor/theme · property · type · │
                 │          season · retailer · status         │
                 └─────────────────────────────────────────────┘
                            ▲                      ▲
         POP ──────────────┘                      └────────────── SPRUCE
   ┌──────────────────┐                            ┌──────────────────────┐
   │  PROJECT CARD    │                            │  DESIGN COLLECTION   │
   │  buyer·retailer· │                            │  theme, account-     │
   │  season·brief·   │                            │  agnostic, no style# │
   │  on-shelf date·  │                            │  (General Present.)  │
   │  PPS-req date    │                            └──────────┬───────────┘
   └────────┬─────────┘                                       │ buyer selects
            │ buyer picks / submission need                   ▼
            ▼                                       ┌──────────────────────┐
   ┌──────────────────┐                            │  PROJECT CARD        │
   │  SKU CARD        │                            │  ACCOUNT-BUYER-TITLE │
   │  immutable SKU#· │                            │  selections PDF      │
   │  17-stage pipe·  │                            └──────────┬───────────┘
   │  Brand Assurance·│                                       │ commit (PO/sample)
   │  PI·order history│                                       ▼
   └──────────────────┘                            ┌──────────────────────┐
                                                    │  STYLE NUMBER RECORD │
                                                    │  style#·11-stage pipe│
                                                    │  order #s·files      │
                                                    └──────────────────────┘
```

**Shared primitives across both lines:** time-in-stage tracking, cancel-with-reason, role-scoped views, notifications to the next person, notes/history on every object, NAS-path + DAM-thumbnail file linkage, bulk operations, CSV/mockup export, the design library, and the AI query layer.

## 33. Prioritized build list

### Tier 0 — Foundational (nothing works without these)
1. **Dual data model** — POP 2-tier (Project→SKU) and Spruce 3-tier (Collection→Project→Style#), with mandatory child→parent linkage. Configurable per business unit.
2. **Design library** — searchable by licensor/theme + property + product type + season + retailer; POP includes unpicked preliminaries, Spruce includes style-numbered items only; one-click attach to a new project.
3. **Two pipelines** — POP's 17 stages (§10) and Spruce's 11 stages (§21) as explicit, per-unit configurable stage sets.
4. **Cancel state with mandatory reason** — POP reasons (cost/licensing/sampling/buyer); Spruce (buyer didn't move forward, etc.); plus a bulk "Abandoned" migration for ancient open items.

### Tier 1 — Core friction-killers
5. **Time-in-stage + on-track indicator** (§15) driven by the §14 SLA tables; stuck alerts and dormant ("Concept Approved, no PO") alerts.
6. **Bulk operations** — stage advancement, designer assignment, CSV export, mockup/thumbnail download (§17).
7. **Creative Director queue** — Liz's submission tracker/checklist with time-in-stage per item and a single notes home (§11.4, §12); a Jen-equivalent "in development for PO" priority view (§21).
8. **Brand Assurance field** (required at "Concept submitted", reused at production) + **PI field** (Required/Not Required/Completed, per-licensor default) — POP only (§10.1, §10.2).
9. **Role-scoped views** — PM, Creative Director, Creative Designer, Technical Designer, Sales, Licensing; preserve "assigned to me" + color-coding; respect that licensing-team data (Brand Assurance) is invisible to Liz (§11, §18).

### Tier 2 — High-value
10. **Multi-buyer conflict detection** (POP) — alert the instant two projects pick the same design (§8).
11. **Costing/constraint linkage** — specs visible to designers at design time; role-based (sourcing/sales see pricing, designers see specs only); integrate/surface DesignFlow status (§16, §25).
12. **Incremental-progress + next-person notifications** — partial batch visibility; notify the next role on stage completion (§18).
13. **Structured revision notes** on the card (both lines) — consolidating Teams/email/markups (§11.8, §23).
14. **Capacity/workload view** (POP) — designer assignments, overload, surge reallocation (§13).

### Tier 3 — Differentiators
15. **AI natural-language queries** — start with the exact verbatim questions in §34.
16. **Proactive seasonal planner** — POP: season + type → unsold concepts → deck; Spruce: design calendar from prior-year timing (§7, §28, §29).
17. **Sales status view for Adam** — cross-line project status he can self-serve (§29).
18. **Designer track-record view** — revision/rejection patterns per designer (§11.7).
19. **Wholesale-sublicensor handling** — flag Stallion Art / Iconick, structure feedback for external designers (§11.6).

## 34. AI assistant — every verbatim query to support

**Jessica (POP):**
- "How many SKUs have a licensing sheet but the art director hasn't sent it to the licensing team?"
- "How many SKUs have techpacks for factory but the art director hasn't confirmed which factory to send to?"
- "List of all projects for the same retailer (client)."
- "Which designer created more designs (preliminary or art files) this week?"
- "Which designer has the least picks from buyers in the last month?"
- "Summary of this project" → e.g. "Total SKUs 27, 20 sample requested, 3 concept approved, 4 concept submitted; next action: send the three approved concepts to the factory."

**Liz (POP, implied from Q31/Q54):**
- "Which designs were submitted to the licensor but have no response in X days?"
- "Which designer has the highest revision/rejection rate?"

**Jen (Spruce):**
- "What's the actual timing to get pricing and samples?" (not just current status)
- "Status of all sample requests at the factory."
- "Build a design calendar from previous years' project timing."

**From data analysis (consistent with the above):**
- "Which concepts are approved but have no PO and no sample request?" (the 1,574)
- "Which licensor has the most outstanding submissions?"
- "Which products have been stuck in the same stage 30+ days?"

## 35. Design principles for the builder

1. **One source of truth.** The deepest shared pain across all three is fragmentation — ClickUp + Teams + email + shared server + DesignFlow. Every feature should pull information *into* the platform, never add a sixth place to look.
2. **Support expertise, don't replace it.** Liz and Jen both run on judgment, not process. Give them visibility, tracking, and consolidation — never a rubric that gates their craft.
3. **Make the easy path the correct path.** Adoption failed before because the tool was hard and discipline was assumed. Incremental updates, bulk actions, and next-person nudges must be less work than the workaround.
4. **Two businesses, one platform.** Configure per business unit; never force POP's licensor weight onto Spruce or Spruce's collection model onto POP.
5. **Proactive beats reactive.** Both leaders independently asked for the same thing: stop scrambling each season — use history to get ahead. The seasonal planner is where this lives.
6. **Nothing gets lost.** The founding pain (lost preliminary designs) generalizes: every design, decision, note, and stalled item must remain findable, attributable, and reusable.
```
