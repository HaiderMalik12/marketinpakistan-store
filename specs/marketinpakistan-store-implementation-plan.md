# marketinpakistan-store — Phased Implementation Plan

**Companion doc:** `../RETAIL_STORE_ARCHITECTURE.md` (schema, stack, rationale)
**Domain:** `marketinpakistan.shop` — purchased on GoDaddy 2026-09-27 (see `RETAIL_STORE_ARCHITECTURE.md`'s domain-history note: `marketinpakistan.com` was the original target but was lost to a third party after an unpaid renewal, before ever being connected)
**Project name:** `marketinpakistan-store` (not "dhagah-store" — the store is branded under the marketinpakistan domain, not the Dhagah product line)

## Context

`RETAIL_STORE_ARCHITECTURE.md` laid out the target architecture for a custom Next.js retail store: product listing, cart, checkout, admin, email, Cloudinary images. The open question was *how to build it* — in what order, with what infra at each step, and how to avoid building five phases of website before finding out whether the underlying business hypothesis (customers will buy single retail-priced items instead of only messaging WhatsApp) is even true.

That question is not hypothetical: this repo's own history shows **three WhatsApp ad experiments have closed zero orders total**, root-caused twice to wholesale-coded messaging attracting resellers instead of buyers — not a targeting or budget problem. The retail store is the next untested hypothesis after WhatsApp-only closing already failed for a *messaging/positioning* reason. The phased plan below treats early phases as demand tests with pass/fail bars, not just infrastructure milestones, and gates the expensive phases (cart, checkout, DB) behind evidence from the cheap ones.

Confirmed decisions: use "5 genuine retail inquiries in 2 weeks" as the Phase 1 pass bar, build the new project as its own sibling git repo, and use the purchased `marketinpakistan.shop` domain.

---

## ~~Phase 0 — Fix WhatsApp closing~~ SKIPPED (2026-09-27, user decision)

Originally proposed as a prerequisite: WhatsApp Quick Replies (`/order`, `/address`, `/confirm`, `/followup`) and confirming the closing script from `MARKETING_PLAN.md` Step 30 were live, since two prior ad experiments' root-cause writeups blamed a missing closing script for 0 orders. The user chose to skip this and go straight to Phase 1.

**Known consequence, accepted:** if Phase 1 gets inquiries but they don't convert, it will be harder to tell whether that's a website/pricing problem or a WhatsApp-closing problem, since both are now unverified at the same time. Worth revisiting Step 13 in `PROGRESS.md` if Phase 1 produces inquiries that stall.

---

## Cross-cutting decisions

**Repo:** New sibling directory, `/Users/admin/Documents/market-in-pakistan/marketinpakistan-store/`, its own git repo via `npx create-next-app@latest marketinpakistan-store --typescript --tailwind --app`. `mip-business/` has no `.git` and is full of multi-MB image/video assets — not a good deploy target. Give the new repo its own `CLAUDE.md` that gets updated at the end of each phase (what's built, what's next), so a fresh Claude Code session in a later phase has correct context. Also: fix `mip-business/CLAUDE.md` (it still says "no cart/checkout, Shopify in Month 2", targets `dhagah.pk`, and lists the stale `0302-4986565` number) so it stops contradicting this plan for future sessions.

**Domain:** `marketinpakistan.shop` is bought on GoDaddy and connected — DNS is on GoDaddy's own panel (add the A record Vercel gives you; delete GoDaddy's default `A @ Parked` record if present, it conflicts). SPF/DKIM records for transactional email are a separate step, added in GoDaddy's DNS panel when Resend needs domain verification (Phase 4) — connecting the domain for web traffic and verifying it for email are independent and don't need to happen at the same time.

**Attribution:** The `?src=` query param is the one non-negotiable piece of instrumentation across every phase — it's the only way to tell whether YouTube, WhatsApp broadcast, or something else drove an inquiry/order. Build it in from Phase 1, not retrofitted later.

**Vercel plan:** Start on Hobby for private building/testing. Move to Pro (~$20/mo) around the Phase 1 public share — Hobby's terms are for non-commercial use, and this becomes a real order-taking site at that point.

---

## ~~Phase 1 — Listing + WhatsApp CTA (the demand test)~~ SUPERSEDED (2026-09-27)

**The user clarified the actual requirement after seeing this phase built: customers must complete a real checkout, orders must arrive by email, and WhatsApp is for customer support only — not order placement.** This collapses the Phase 1/Phase 2 split below: checkout + cart + order email shipped directly, without the DB (order records exist only as emails for now — no Postgres/Prisma yet, an intentional simplification versus the original Phase 2 design, revisit if email-only records become a real limitation). See `../../marketinpakistan-store/CLAUDE.md` for what's actually implemented and what's still needed (Resend account/API key, real product data, Vercel deploy, domain connection).

The original Phase 1 plan (kept below for the record) treated the WhatsApp CTA itself as a demand test to run *before* building checkout. That sequencing no longer applies — go straight to Phase 3 (admin panel) once real product data and a working Resend account are in place.

<details>
<summary>Original Phase 1 plan (superseded)</summary>

**Depends on:** nothing outstanding — Phase 0 was skipped by user decision (see above).

- Scaffold `marketinpakistan-store` (Next.js App Router + TS + Tailwind), deploy to Vercel, connect `marketinpakistan.shop`
- Routes: `/` (catalog grid), `/product/[slug]` (detail page + WhatsApp CTA button)
- Data: hardcoded `app/data/products.ts`, shaped to match the future Prisma `Product` model from `RETAIL_STORE_ARCHITECTURE.md` (name, slug, price, images, sizes, description) so migrating to the DB in Phase 2 is a seed-script copy, not a rewrite
- Images: manual upload to a Cloudinary account (dashboard only, no upload UI yet), paste resulting URLs into `products.ts` — this alone gets CDN delivery + on-the-fly compression for free
- WhatsApp number as an env var, set to the current live number (`0305-7252013` — `0302-4986565` in `CLAUDE.md` is stale, from the very first ad experiment only)
- `?src=` propagates into the **prefilled wa.me message text** (e.g. "...via yt-video123"), since that's the attribution signal you can actually read off WhatsApp without needing analytics
- No cart, no checkout, no database, no admin, no Resend — deliberately

**Verification (this phase's real test):** Share product links via the existing YouTube video descriptions and WhatsApp broadcast for 1–2 weeks. Count `src`-tagged inquiries. **Pass bar: 5 genuine retail inquiries** (real buyer intent, not reseller/service-seller noise — judge quality the same way prior ad post-mortems did) **in 2 weeks.** Read `wa-broadcast`-sourced inquiries separately from YouTube/cold-traffic ones — the broadcast list is wholesale-conditioned, so a weak result there alone doesn't falsify retail demand elsewhere.

**Do not start Phase 2 until this bar is cleared.** If it isn't, the fix is to the product/pricing/positioning, not to the code.

</details>

---

## ~~Phase 2 — Cart + Checkout + DB Orders~~ MOSTLY DONE, WITHOUT THE DB (2026-09-27)

Implemented directly (see CLAUDE.md in `marketinpakistan-store` for exact status) as: cart (`localStorage`, via `useSyncExternalStore`) + checkout form + `app/api/orders` route that emails the order via Resend. **No Prisma/Postgres** — deliberately skipped for now; an order exists only as an email, not a queryable record. Add the DB back if/when order volume makes that a real limitation (most likely trigger: needing the Phase 3 admin order list to show anything beyond what's in someone's inbox).

<details>
<summary>Original Phase 2 plan (DB-first design, partially superseded)</summary>

**Depends on:** Phase 1 clearing its threshold.

- Add Prisma schema: `Catalog`, `Product`, `Order`, `OrderItem` (per `RETAIL_STORE_ARCHITECTURE.md`, sized S–XXL, flat `stock: Int`, not per-size — real availability gets confirmed on the WhatsApp follow-up call, consistent with the `PENDING_CONFIRMATION` order status)
- Add the subscriber opt-in checkbox at checkout now (storage only — the actual email send is Phase 4), per the architecture doc's "capture from day one"
- Infra: Neon Postgres + Prisma; Resend for the **owner notification email only** (check first whether Resend's default onboarding sender can deliver reliably to the owner's own inbox — that may remove the need for domain verification at this stage)
- Routes: `/cart`, `/checkout`, `app/api/orders`, `/order/[id]/thank-you` with the WhatsApp handoff button
- No admin yet — manage products via a seed script or `prisma studio` run locally

**Verification:** Track the funnel — product clicks → checkout starts → orders created → orders *confirmed by an actual WhatsApp call*, not raw DB row counts. A completed checkout form is a stronger signal than a WhatsApp message, but it's still not a sale until confirmed.

**Pause here** and run real traffic again before starting Phase 3 — this is the second real demand checkpoint (will people fill out a form vs. just message?).

</details>

---

## Phase 3 — Admin Panel

**Depends on:** Phase 2 showing enough product/order volume that manual `prisma studio` management is a genuine bottleneck (not built pre-emptively).

- `/admin` — single env-var password + signed cookie, no multi-user auth
- `/admin/products` — CRUD + Cloudinary signed upload (client uploads directly to Cloudinary via a short-lived signed token from an API route, bypassing Vercel's function body-size limit)
- `/admin/orders` — list, filter by status, update status, CSV export

**Verification:** The owner adds a new product and updates an order's status entirely through the UI — no code edit or redeploy required.

This phase is operational, not a demand test — it can be built back-to-back with Phase 4 without a real-world pause.

---

## Phase 4 — Customer Email + Domain Email Verification

**Depends on:** Phase 3 (or can run in parallel with it).

- Verify `marketinpakistan.shop` with Resend and add its SPF/DKIM records in GoDaddy's DNS panel
- Add the customer confirmation email on order placement (only when the customer provided an email)

**Verification:** A real test order triggers both the owner and customer emails, and both land outside spam.

---

## Phase 5 — Broadcast + Attribution Reporting

**Depends on:** A non-trivial subscriber list from Phase 4, and multiple `src` values with real order volume from Phases 1–2 to report on.

- Manual, admin-triggered broadcast sender (pick products → send to opted-in subscribers via Resend)
- `?src=` attribution reporting (which channel is actually producing orders)
- CSV export polish

**Verification:** A sent broadcast produces trackable orders back to its `src` value.

This is the architecture doc's deferred "Phase 2 scope" — automated weekly cron, payment gateways, courier APIs, and the WhatsApp Business API bot stay out of scope entirely until this phase is done and justified by volume.

---

## Critical files

- `../RETAIL_STORE_ARCHITECTURE.md` — architecture reference for schema, stack, and rationale
- `../CLAUDE.md` — needs updating (stale WhatsApp number, `dhagah.pk` target, contradicts this plan's cart/checkout/domain decisions)
- `../PROGRESS.md` — Step 13 (WhatsApp closing script) was proposed as a prerequisite, skipped by user decision; revisit if Phase 1 inquiries stall
- `/Users/admin/Documents/market-in-pakistan/marketinpakistan-store/app/data/products.ts` — created in Phase 1
- `/Users/admin/Documents/market-in-pakistan/marketinpakistan-store/prisma/schema.prisma` — created in Phase 2

## Verification summary (end-to-end)

Each phase has its own pass bar above; the two that matter most are Phase 1 (5 genuine retail inquiries in 2 weeks via `?src=`-tagged WhatsApp links) and Phase 2 (checkout completions that convert to WhatsApp-confirmed orders). Phases 3–5 are verified by direct use (admin can manage the store without a redeploy; a broadcast produces attributable orders), not by additional demand thresholds — by that point the core hypothesis is already validated.
