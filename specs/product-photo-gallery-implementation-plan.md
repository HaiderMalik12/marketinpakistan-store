# Product photo gallery (customer side)

> Design mockups (private, owner can share): https://claude.ai/artifact/LKgpyunMJ1UYQxam7VLM3y — boards 4 to 7 (phone page, desktop page, full-screen zoom, cards with photo count).

## Context
The admin panel already lets the brother attach up to 8 photos to a product (front, back, close-up, fabric, …) and stores them in `products.images` (ordered, first = cover). But the customer-facing product page (`app/product/[slug]/page.tsx`) only renders `product.images[0]`, so customers cannot see the other angles, which they need to decide on a purchase. Confirmed on the live site on 2026-09-30: a product with 2 photos showed 1 photo to the customer.

This plan adds a gallery to the customer side only. No database change, no new dependency.

## Decisions (owner approved the design approach; questions below answered with the recommended default — change before building if wrong)
1. **No captions/labels per photo.** Order alone decides what shows first; the brother orders photos as front, back, close-up. (Extra typing for him, little value for customers.)
2. **Full-screen zoom included** on the product page (tap the main photo).
3. **Link previews unchanged:** WhatsApp/OG keeps using the first photo (`images[0]`).

## Behaviour (per the design)
- **Product page, phone:** large photo (square-ish, full width) with a `2 / 4` counter, previous/next arrow buttons, dots, and a thumbnail row underneath. The photo strip is swipeable natively (CSS scroll-snap), so swiping, arrows, dots and thumbnails all stay in sync.
- **Product page, desktop:** vertical thumbnail column on the left, large photo beside it, "Click to zoom" hint, details on the right (existing 2-column layout becomes thumbnails + photo | details).
- **Full-screen zoom:** dark overlay built on the native `<dialog>` (`showModal()`, so Esc closes, focus is trapped and restored for free). Shows the selected photo at a larger size with counter, close button and a thumbnail strip; tap/double-tap toggles 2x zoom with scroll-to-pan; swipe/arrow keys go to the next photo. Pinch relies on the browser (`touch-action: pan-x pan-y pinch-zoom`); no gesture library.
- **One photo:** no arrows, dots, counter or thumbnails; the page looks like today, and tapping still opens the zoom.
- **Cards (home + sale page):** a product with 2+ photos shows a small "N photos" badge on the card; cover photo unchanged. Single-photo cards are unchanged.
- **Sold-out** products still show the full gallery (only Add to Cart changes).
- Images use `optimizedImage()` (`app/lib/images.ts`): main 900 px, thumbnails 160 px, zoom 1600 px. First photo loads eagerly, the rest lazily.

## Files
- **New** `app/components/product-gallery.tsx` (client component): props `{ images: string[]; name: string }`. State: selected index; scroll-snap strip with an `IntersectionObserver`/`scrollend` handler to update the index on swipe, `scrollTo` on thumbnail/arrow click. Contains the zoom `<dialog>`.
- **Edit** `app/product/[slug]/page.tsx`: replace the single `<img>` with `<ProductGallery images={product.images} name={product.name} />`; keep `generateMetadata` on `images[0]`.
- **Edit** `app/components/product-card.tsx`: "N photos" badge when `product.images.length > 1` (reuse the existing "Sold out" badge positioning pattern; place bottom-right so both can show).
- **Edit** `app/components/admin/photo-uploader.tsx`: add "move earlier / move later" buttons next to "Make cover" so the brother can order front, back, close-up (today only "Make cover" exists, which is not enough to order the rest).
- Reuse: `optimizedImage()` in `app/lib/images.ts`; Tailwind classes and rose/gray palette already used on the product page; the `Product.images` type from `app/lib/products.ts` (no change).
- Read `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md` before writing the client component (per `AGENTS.md`), and keep to this repo's ESLint rule (`react-hooks/set-state-in-effect`): derive the selected index from events/scroll callbacks, not from effects that call `setState` synchronously.

## Tasks

### Phase 1: Gallery component
- [x] Read the Next docs above; note the lint rule constraint
- [x] Create `product-gallery.tsx`: main scroll-snap strip, counter, arrows, dots, thumbnail row (phone layout)
- [x] Desktop layout: vertical thumbnails left, large photo, "Click to zoom" hint (`md:` breakpoint)
- [x] Single-photo mode (no controls)
- [x] Accessibility: real `<button>`s with `aria-label`s ("Show photo 2", "Previous photo"), `aria-current` on the active thumbnail, live counter (`aria-live="polite"`), touch targets >= 44 px, alt text `"{name}, photo N of M"`
- [x] Wire into `app/product/[slug]/page.tsx`; keep the sold-out and Add to Cart logic untouched
- [x] Verify: `npm run lint`, `npx tsc --noEmit`, `npm run build`
  - Built: `app/components/product-gallery.tsx`, wired into the product page (container widened to `max-w-5xl`). Checked in a browser with a temporary 3-photo product (deleted afterwards): counter, Next/Previous with wrap-around, thumbnail click, manual scroll/swipe updates the counter, desktop thumbnail column vs phone dots, single-photo product shows no controls, no page errors. Real-phone swipe still to be checked in Phase 4.

### Phase 2: Zoom
- [x] `<dialog>` overlay: open on tap/click of the main photo, close button, Esc (no separate backdrop click: the photo fills the screen)
- [x] Selected photo carries over in both directions (opening on photo 3 shows photo 3; closing keeps 3 selected)
- [x] 2x toggle on tap/double-tap with scroll-to-pan; thumbnail strip + arrow keys/swipe to change photo
- [x] Lock page scroll while open (native `<dialog>` modal handles inert background; confirm no double scroll on iOS)
  - Built inside `product-gallery.tsx` (native `<dialog>`). Tap toggles 2x with scroll-to-pan; swipe (pointer drag > 50 px), arrow keys, arrows and thumbnails change photo; a swipe does not also toggle zoom; `document.body.style.overflow` locks scroll while open and is restored on every close path (and on unmount). The fit-to-screen view reuses the 900 px image; only real zoom loads 1600 px, and the zoom `<img>` is keyed per photo so a slow-loading photo never shows under the wrong counter.
  - Browser-tested at phone and desktop widths with a temporary 3-photo product (deleted): opens on the selected photo, Next/ArrowLeft/swipe, zoom in/out, Esc and Close, scroll lock released, main gallery lands on the photo chosen in zoom, single-photo zoom, desktop "Click to zoom" hint hidden on phones, no page errors. Pinch zoom and iOS behaviour still need a real-phone check (Phase 4).

### Phase 3: Cards + admin ordering
- [x] "N photos" badge in `product-card.tsx` (coexists with "Sold out")
- [x] Move earlier / move later buttons in `photo-uploader.tsx` (keyboard accessible; first stays cover)
- [x] Verify the admin can reorder and the customer page shows the new order
  - Built: "N photos" badge (bottom-right, coexists with the top-left "Sold out" badge) in `product-card.tsx`; move earlier / later buttons (44 px high, disabled at the ends, real `<button>`s with labels) under each photo in `photo-uploader.tsx`, plus updated help text.
  - Browser-tested with a temporary sold-out 3-photo product (deleted): badge on multi-photo cards only, badge + Sold out together, admin reorder [1,2,3] -> [1,3,2] -> [3,1,2], Cover badge follows the first photo, saved order in the database, and the customer product page, WhatsApp/OG image and sale-card cover all switched to the new first photo. No page errors.

### Phase 4: Verify and ship
- [ ] Browser test at phone (375 px) and desktop (1280 px) with Playwright against `next dev`, using a **temporary test product inserted directly in the database with 3 existing Cloudinary URLs** (no new uploads, so no orphan files), deleted afterwards. Check: thumbnails change the photo, arrows wrap around, swipe (touch scroll) updates counter/dots, zoom opens/closes/Esc, opened photo matches, single-photo product shows no controls, card badge appears only for 2+ photos, sold-out product still shows the gallery
- [ ] Check cover photo/OG image is still `images[0]` (view-source on the product page)
- [ ] Update `CLAUDE.md` "What's implemented" (gallery, zoom, badge, admin reorder) and tick this spec
- [ ] Commit, ensure `gh auth` active account is `HaiderMalik12`, push `main`, confirm `npx vercel ls` shows Ready
- [ ] Live check on marketinpakistan.shop with the temporary test product (then delete it); look at it once on a real phone

## Out of scope
Per-photo captions, video, pinch-zoom gesture library, image cropping/editing in admin, drag-and-drop reordering, deleting Cloudinary files when a photo is removed.

## Risks
Swipe/scroll-snap index sync differs slightly across iOS Safari and Android Chrome (`scrollend` support): use an `IntersectionObserver` fallback and test on a real phone. Very large galleries (8 photos) on slow mobile connections: only the first photo loads eagerly.
