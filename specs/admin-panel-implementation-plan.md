# Admin panel: product upload, edit, hide, delete (Neon Postgres + Cloudinary)

> Design mockups: https://claude.ai/artifact/LKgpyunMJ1UYQxam7VLM3y (private; owner can share)


## Context
Today the owner's brother sends dress photos, then the owner manually uploads them to Cloudinary and hand-edits `app/data/products.ts` and redeploys. The goal is a password-protected admin panel where the brother uploads photos and creates, edits, hides or deletes products himself, and files each one into a collection (currently only "Winter Clearance Sale"), with no code change or redeploy.

Decisions already made with the owner: one shared password; photos to **Cloudinary**; product data in **Neon Postgres** (free plan: 0.5 GB, 100 compute-hours/month, sleeps after 5 min idle, no card; commercial-use terms not stated on Neon's pricing page, owner to read the terms); edit / hide / delete supported; UI per the design canvas (list, add form desktop, add form phone).

## Findings that shape the plan
- Next.js is **16.3.6**: middleware is now `proxy.ts`; read `node_modules/next/dist/docs/01-app/` (`01-getting-started/16-proxy.md`, `02-guides/authentication.md`, `09-revalidating.md`, `07-mutating-data.md`) before coding, per `AGENTS.md`. `cacheComponents` is **not** enabled in `next.config.ts`, so keep the current model: server components, `revalidatePath` after admin saves.
- Products are read in only 4 places: `app/page.tsx`, `app/winter-clearance/page.tsx`, `app/product/[slug]/page.tsx` (+ `generateStaticParams`), `app/components/product-card.tsx` (type only). All import from `app/data/products.ts`. Keeping the `Product` type and the `getCollectionProducts` name means UI changes are small.
- `app/api/orders/route.ts` **trusts prices and names sent by the browser** (`priceBreakdown(body.items)`). With a database this should be fixed, and it is also the only place stock (quantity) can be enforced. Included as Phase 4.
- Cart items store `slug/name/price` snapshots in `localStorage` (`app/lib/cart.ts`); a hidden or deleted product can still sit in someone's cart.
- Phone photos are large and Vercel functions cap request bodies (~4.5 MB): upload **directly from the browser to Cloudinary** with a server-generated signature, never through our API.
- Existing photos: `https://res.cloudinary.com/duwktiwnj/image/upload/v…/rangreet/rangreet-design-N.jpg`. The repo uses plain `<img>` (no `next/image`), so add Cloudinary URL transforms (`f_auto,q_auto,w_800`) to keep raw phone photos from being served at full size.

## Data model (`db/schema.sql`)
```
collections(slug text PK, title text, tagline text, sort int)
products(
  id serial PK, slug text UNIQUE NOT NULL,
  name text NOT NULL, description text NOT NULL DEFAULT '',
  price int NOT NULL CHECK (price >= 0),
  quantity int NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  catalog text NOT NULL DEFAULT '',            -- the "Volume" field
  collections text[] NOT NULL DEFAULT '{}',    -- slugs, same shape as today's Product.collections
  images text[] NOT NULL DEFAULT '{}',         -- Cloudinary URLs, first = cover
  sizes text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'live' CHECK (status IN ('live','hidden')),
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now())
```
Column `name` (not `title`) so the existing `Product` type and UI are untouched. "Draft" in the mockups = `hidden`. `db/seed.sql`: the 10 Rangreet products + the `winter-clearance` collection (quantities set by the owner). Slug auto-generated from the name (`slugify`, append `-2`, `-3` on clash) and not changed on edit, so shared links keep working.

## Architecture
- **DB access:** `@neondatabase/serverless` with plain SQL (no ORM; two tables). `app/lib/db.ts` (server-only), `app/lib/products.ts` = all queries: `listLiveProducts`, `getProductBySlug` (live only, for storefront), `getCollectionProducts`, `listAllProducts`, `getProductById`, `createProduct`, `updateProduct`, `setProductStatus`, `deleteProduct`, `listCollections`. `app/data/products.ts` is deleted at the end (it only seeds).
- **Storefront caching:** pages stay server components reading the DB. Admin mutations call `revalidatePath("/", "layout")`; product/sale pages also export `revalidate = 300` as a safety net. Product page keeps `generateStaticParams` (DB read at build) with `dynamicParams = true` so a brand-new slug works immediately; a hidden or deleted slug returns `notFound()`.
- **Auth (shared password):**
  - `ADMIN_PASSWORD` + `SESSION_SECRET` env vars. `app/lib/session.ts` (server-only, `jose`): signed JWT in an `httpOnly`, `secure`, `sameSite=lax` cookie, 7-day expiry. Password compared with `crypto.timingSafeEqual`; failed logins wait ~1 s. There is no shared memory on serverless, so no in-memory rate limit. Password should be long (e.g. 5 random words).
  - `proxy.ts` matcher `/admin/:path*` does the optimistic redirect to `/admin/login`. **Every** server action and admin route handler also calls `requireAdmin()` itself; proxy alone is not treated as authorization (per the Next.js auth guide).
- **Photo upload:** `POST /api/admin/cloudinary-sign` (admin only) returns `{signature, timestamp, apiKey, cloudName, folder:"products"}`, signing `allowed_formats=jpg,png,webp,heic&folder=products&timestamp=…` with SHA-1 via `node:crypto` (no SDK). Browser posts the file to `https://api.cloudinary.com/v1_1/<cloud>/image/upload`, gets `secure_url`, and stores the URLs in the form. Cover = first image; reorder / remove before saving. Deleting a product does not delete Cloudinary files in v1 (orphans are harmless, cleanup is later).
- **Admin UI** under `app/admin/` (noindex; `SiteHeader` returns `null` on `/admin` paths using the `usePathname` it already has, so no route-group move):
  - `login/page.tsx`
  - `(protected)/layout.tsx`: sidebar on desktop, top bar on phone, logout button
  - `(protected)/page.tsx`: products list with tabs All / per-collection / Hidden, row actions Edit, Hide/Show, Delete (inline confirm dialog)
  - `(protected)/new/page.tsx` and `(protected)/[id]/edit/page.tsx`, sharing `app/components/admin/product-form.tsx` (client) and `photo-uploader.tsx`
  - `app/admin/actions.ts`: server actions `login`, `logout`, `saveProduct`, `setProductStatus`, `deleteProduct` with server-side validation (name required, price/quantity non-negative integers, at least one photo, collection must exist).
  - Styling: Tailwind, matching the design canvas (rose accent, ≥44 px touch targets, real `<label>`s); form works one-column on phones.
- **Storefront changes:** sold-out state when `quantity === 0` (badge on card, disabled "Add to Cart" with "Sold out"), quantity input capped at stock, sale page/home read from DB, image URLs passed through `optimizedImage(url, width)` (`app/lib/images.ts`).
- **Orders (Phase 4):** `app/api/orders/route.ts` re-reads each item by slug from the DB, rejects hidden/missing/insufficient-stock items with `409 {unavailable:[…]}`, prices from the DB (never the client), and decrements stock in one atomic `UPDATE … SET quantity = quantity - $n WHERE quantity >= $n` transaction before sending the email. Checkout page shows "some items are no longer available" with a link back to the cart. If the email then fails, stock is restored.

## Environment variables (`.env.local.example` + Vercel Production/Preview/Development)
`DATABASE_URL` (added automatically by the Neon integration in the Vercel dashboard, pull with `npx vercel env pull`), `ADMIN_PASSWORD`, `SESSION_SECRET` (`openssl rand -base64 32`), `CLOUDINARY_CLOUD_NAME` (`duwktiwnj`), `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`. Dependencies added: `@neondatabase/serverless`, `jose`, `server-only`.

## Tasks

### Phase 0: Owner setup (needs the owner, not code)
- [x] Read Neon's free-plan terms (commercial use); decide go / no-go
- [x] Add **Neon** via `npx vercel integration add neon` (done: resource `neon-charcoal-yacht`, `DATABASE_URL` in all 3 environments). A separate Neon `dev` branch was NOT created, so local dev and production share one database
- [x] Cloudinary dashboard → copy API key + API secret (Settings → API Keys)
- [x] Choose the shared admin password (long); generate `SESSION_SECRET`; add all env vars to Vercel (all 3 environments) and `.env.local`
- [ ] Give the actual quantity in stock for the 10 existing Rangreet designs (or agree a default)

### Phase 1: Database + storefront reads from it
- [x] Read Next docs listed under Findings
- [x] `npm i @neondatabase/serverless jose server-only`; update `.env.local.example`
- [x] Write `db/schema.sql`, `db/seed.sql`; add `scripts/apply-sql.mjs` (runs a SQL file against `DATABASE_URL`); apply to the `dev` branch, then to production
- [x] `app/lib/db.ts`, `app/lib/products.ts` (queries above, rows mapped to the existing `Product` type)
- [x] Switch `app/page.tsx`, `app/winter-clearance/page.tsx`, `app/product/[slug]/page.tsx` (`generateStaticParams`, `dynamicParams`, `notFound` for hidden) to `app/lib/products.ts`; `product-card.tsx` type import
- [x] `app/lib/images.ts` `optimizedImage()`; use it in cards, hero collage, product page
- [x] Sold-out UI + quantity cap (card badge, product page, `AddToCartForm`)
- [x] Verify: storefront reads from Neon; lint + build pass; browser test of home/sale/product/sold-out/unknown slug passed. Note: `app/data/products.ts` was already deleted here (planned for Phase 5); seed quantities are a placeholder 10 each

### Phase 2: Admin auth
- [x] `app/lib/session.ts` (`createSession`, `verifySession`, `requireAdmin`, `destroySession`)
- [x] `app/admin/login/page.tsx` + `login` / `logout` actions (timing-safe compare, 1 s delay on failure)
- [x] `proxy.ts` (matcher `/admin/:path*`, redirect to login)
- [x] `SiteHeader` hides on `/admin*`; admin `robots: noindex`
- [x] Verify (browser, phone width): logged-out `/admin` redirects; wrong password rejected after ~1 s; right password signs in; cookie httpOnly + SameSite=Lax; logout works; forged cookie rejected; storefront header still shows. Session token logic lives in `app/lib/session-token.ts` so `proxy.ts` can import it

### Phase 3: Admin product management
- [ ] `app/admin/(protected)/layout.tsx` (sidebar / mobile top bar, logout)
- [ ] `POST /api/admin/cloudinary-sign` (admin only, signed params incl. allowed formats and folder)
- [ ] `photo-uploader.tsx`: choose/camera, progress, remove, set cover / reorder, direct upload to Cloudinary
- [ ] `product-form.tsx` + `saveProduct` action with validation; slug generation
- [ ] `new` and `[id]/edit` pages
- [ ] Products list page: tabs, row actions Hide/Show (`setProductStatus`), Delete with confirm (`deleteProduct`)
- [ ] `revalidatePath` after every mutation
- [ ] Verify (real browser, phone 375 px + desktop): create with real photo → appears on `/winter-clearance` and home; hide → 404 on product URL and gone from lists; show → back; edit price/qty; delete; unauthenticated `curl` to the sign route and to each action returns 401/redirect

### Phase 4: Server-authoritative orders (recommended; stock and price integrity)
- [ ] Rework `app/api/orders/route.ts` as described (DB price, availability check, atomic stock decrement, restore on email failure)
- [ ] Checkout/cart: show unavailable-item message on `409`
- [ ] `app/lib/pricing.ts` stays as is (delivery tiers still computed from quantity)
- [ ] Verify: tampered `price` in the request is ignored; ordering more than stock or a hidden item is rejected; successful order lowers stock; email still sent

### Phase 5: Ship
- [ ] Remove `app/data/products.ts` once nothing imports it; `npm run lint && npm run build`
- [ ] Update `CLAUDE.md` "What's implemented" (admin panel, DB, env vars, hide vs delete, Cloudinary folder, owner-only manual steps) and mark the "product data hardcoded" bullet done
- [ ] Commit, `gh auth` must be `HaiderMalik12`, push `main`, check `npx vercel ls`
- [ ] Production smoke test on marketinpakistan.shop (login, create a test product, place a test order, then delete the test product)
- [ ] Hand the brother the URL `/admin` and the password (never committed, never in chat logs beyond the setup)

## Out of scope for v1
Adding new collections from the UI (Summer is one SQL insert until then), per-user logins, drag-drop bulk upload, deleting Cloudinary files on product delete, sizes editor (current dresses are unstitched, `sizes` stays `{}`), order history, analytics.

## Verification summary
`npm run lint`, `npm run build`, then a Playwright pass in the scratchpad (as done for the mobile menu) against `next dev` on the Neon `dev` branch: auth, upload/create/hide/edit/delete, phone viewport, sold-out UI, tampered-order request. Finish with the production smoke test above.

## Risks
Neon free plan wake-up delay on the first request after idle (~1 s) and the unconfirmed commercial-use wording; single shared password with no rate limiting (mitigated by long password + delay); Cloudinary API secret must stay server-only (never `NEXT_PUBLIC_`).
