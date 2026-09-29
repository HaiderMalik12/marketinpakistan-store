# CLAUDE.md

This is the marketinpakistan retail store — a Next.js site for a family fashion business in Faisalabad, Pakistan, selling eastern dresses. It replaces a pure-WhatsApp order flow for customers who want single items instead of wholesale-catalog quantities.

**Full spec:** `../mip-business/specs/marketinpakistan-store-implementation-plan.md` — phased build-out, current phase, and why each phase is sequenced the way it is.
**Architecture reference:** `../mip-business/RETAIL_STORE_ARCHITECTURE.md` — schema, stack, rationale.

## Current status (update this section at the end of each phase)

**Revised 2026-09-27, superseding the original Phase 1 plan below.** The business owner clarified the actual requirement: customers must complete a real checkout, the business must receive orders by **email**, and WhatsApp is for **customer support only**, not order placement. This collapses the original "Phase 1 = WhatsApp-CTA-only demand test, no DB, gated before Phase 2" sequencing — checkout + order email shipped directly instead. Phase 0 (fixing the WhatsApp closing script) remains explicitly skipped by the business owner's decision, but is now less load-bearing since WhatsApp is no longer the order-closing channel.

**What's implemented:**
- Cart: `app/lib/cart.ts` (`useSyncExternalStore`-backed, persisted to `localStorage` as `mip_cart`) — supports multiple products/sizes in one order, matching the "customers buy single items across multiple catalogs" requirement
- Product page (`app/product/[slug]/page.tsx`): `AddToCartForm` (size + quantity) replaces the old per-product "Order on WhatsApp" button
- `/cart` and `/checkout`: checkout form (name, phone required, email optional, address, city) posts to `app/api/orders/route.ts`
- `app/api/orders/route.ts`: validates the order, emails it to `ORDER_NOTIFICATION_EMAIL` via Resend (`resend` npm package). **Not yet functional** — `RESEND_API_KEY` and `ORDER_NOTIFICATION_EMAIL` are unset in `.env.local`; until they're filled in, checkout fails gracefully with a "not configured, contact us on WhatsApp instead" message and a WhatsApp fallback link (verified in a real browser test — this fallback path works)
- Customer confirmation email is sent best-effort (non-blocking) when the customer provides an email — **will not actually deliver** until `marketinpakistan.shop` is verified as a sending domain with Resend (a Resend account without domain verification can only deliver to the account's own registered address)
- No order persistence (no database) — an order exists only as an email; there is no admin view of past orders yet. This is an intentional simplification versus the original architecture doc's DB-first Phase 2, chosen to ship the actual requirement (checkout + email) fast; revisit once order volume makes "email is the only record" a real problem
- WhatsApp is now support-only: `app/components/general-whatsapp-button.tsx`, shown in the site header and as a fallback on checkout errors — not tied to placing an order
- Product data still hardcoded in `app/data/products.ts` (placeholder products — replace before sharing publicly); images still a local placeholder SVG (no Cloudinary account yet)
- `?src=` attribution (`app/components/source-tracker.tsx`) still captured into `localStorage`, now passed into the order email's `Source:` field server-side — no longer dependent on the business owner manually reading it off a WhatsApp message

**Deployed 2026-09-27:** Live at **https://marketinpakistan.shop** (also reachable at the underlying `*.vercel.app` URL) — deployed under the owner's *personal* Vercel scope (`haider-maliks-projects-e8824f17`), Hobby plan, $0/month. The project was originally created via `vercel deploy` with no Git connection, so pushes silently didn't deploy (site sat stale for a day); it was connected to `github.com/HaiderMalik12/marketinpakistan-store` on 2026-09-29, and pushes to `main` now auto-deploy to production. Manual fallback: `npx vercel --prod`. `RESEND_API_KEY`, `ORDER_NOTIFICATION_EMAIL` (`marts3674@gmail.com`), `ORDER_FROM_EMAIL`, and `NEXT_PUBLIC_WHATSAPP_NUMBER` are all set as Vercel env vars (Production/Preview/Development). Checkout → order email verified working against localhost, the `.vercel.app` URL, and the final custom domain, all with real test orders. `metadataBase` in `app/layout.tsx` points at `https://marketinpakistan.shop` — confirmed via a live OG-tag check that image URLs resolve correctly for WhatsApp link previews.

**Domain history — `marketinpakistan.com` is NOT this business's domain, despite earlier assumptions in this repo.** It expired and was removed from the owner's GoDaddy account around 2026-08-30 (missed renewals, ultimately a billing/payment failure per GoDaddy's own emails), then was re-registered by an unrelated third party on 2026-09-08 (registrar Ultahost, nameservers on Cloudflare) — confirmed via direct RDAP registry lookup, not just a UI reading. The owner chose not to pursue GoDaddy's domain-broker buyback (₨54,999 fee alone, no guaranteed outcome) and instead bought **`marketinpakistan.shop`** fresh, same brand (matches the "Market in Pakistan" YouTube channel), auto-renew now enabled. Any reference to `marketinpakistan.com` elsewhere in this repo's docs is stale.

**Cost note, learned the hard way:** creating a separate Vercel *Team* for the business (to keep it separate from the owner's personal `haidermalik.dev` project) was tried first, but a Team is a Pro-plan construct on Vercel — it is not a free container the way "Hobby" is. It put the account on a live Pro subscription (~$9.33 already accrued in the first partial billing cycle) rather than a free trial-only sandbox. The owner asked to keep costs at $0 while pre-revenue, so that team was abandoned (owner needs to delete it manually via the Vercel dashboard — team deletion isn't exposed in the CLI) and the project was redeployed under the personal Hobby scope instead. **Revisit the Team-based separation once the business can justify ~$20/month**, not before. Hobby's non-commercial-use ToS caveat (see `RETAIL_STORE_ARCHITECTURE.md` infra checklist) still technically applies to running a commercial store here — accepted as a known, deliberate tradeoff for now, not an oversight.

**Still needed:**
1. Real product data and photos (Cloudinary still not set up — placeholder image/data approach still applies)
2. Verify `marketinpakistan.shop` with Resend so customer confirmation emails actually deliver (currently only the owner-notification email works)

## Conventions

- Next.js App Router + TypeScript + Tailwind CSS
- Plain `<img>` tags, not `next/image` — product images will be served pre-optimized from Cloudinary once that's wired up, so there's no need for Next's own image optimization pipeline
- Cart state uses `useSyncExternalStore`, not `useState` + `useEffect` — this repo's ESLint config (`react-hooks/set-state-in-effect`, part of the React Compiler rule set) errors on synchronous `setState` inside effects, so reading/writing `localStorage`-backed state should go through an external store, not an effect
- Deploy by pushing to `main` on GitHub — Vercel auto-deploys it to production (marketinpakistan.shop). Don't make dummy "trigger rebuild" commits; if the live site looks stale, run `npx vercel ls` to see whether a deployment was created, and use `npx vercel --prod` only as a manual fallback
- No payment gateway — Cash on Delivery, confirmed manually after checkout (by phone/WhatsApp), matches how the business already operates

---

@AGENTS.md
