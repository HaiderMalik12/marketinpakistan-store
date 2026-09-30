import "server-only";
import { getSql } from "@/app/lib/db";
import { getProductsBySlugs } from "@/app/lib/products";
import type { CartItem } from "@/app/lib/cart";

// What we accept from the browser: which product, size and how many. Names and
// prices in the request are ignored; they are re-read from the database.
export type OrderLine = { slug: string; size?: string; quantity: number };

export type Correction = {
  slug: string;
  name: string;
  reason: "gone" | "stock" | "price";
  available?: number; // reason "stock": how many can still be ordered
  price?: number; // reason "price": the current price
};

const MAX_LINES = 50;
const MAX_QUANTITY = 999;

export function parseLines(raw: unknown): OrderLine[] | null {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_LINES) return null;
  const lines: OrderLine[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") return null;
    const { slug, size, quantity } = entry as Record<string, unknown>;
    if (typeof slug !== "string" || !slug) return null;
    if (!Number.isInteger(quantity) || (quantity as number) < 1 || (quantity as number) > MAX_QUANTITY) return null;
    lines.push({
      slug,
      size: typeof size === "string" && size ? size : undefined,
      quantity: quantity as number,
    });
  }
  return lines;
}

function totalsBySlug(lines: OrderLine[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const l of lines) totals.set(l.slug, (totals.get(l.slug) ?? 0) + l.quantity);
  return totals;
}

// Compares the cart against the database. `clientPrices` are the prices the
// customer saw (from their cart); if any differ, they must confirm again.
export async function checkLines(
  lines: OrderLine[],
  clientPrices: Map<string, number>
): Promise<{ priced: CartItem[]; corrections: Correction[] }> {
  const totals = totalsBySlug(lines);
  const products = await getProductsBySlugs([...totals.keys()]);
  const bySlug = new Map(products.map((p) => [p.slug, p]));

  const corrections: Correction[] = [];
  for (const [slug, wanted] of totals) {
    const p = bySlug.get(slug);
    if (!p || p.status !== "live") {
      corrections.push({ slug, name: p?.name ?? slug, reason: "gone" });
    } else if (p.quantity < wanted) {
      corrections.push({ slug, name: p.name, reason: "stock", available: p.quantity });
    } else if (clientPrices.get(slug) !== p.price) {
      corrections.push({ slug, name: p.name, reason: "price", price: p.price });
    }
  }

  const priced: CartItem[] = [];
  if (corrections.length === 0) {
    for (const l of lines) {
      const p = bySlug.get(l.slug)!;
      // A size only counts if this product actually has sizes and it is one of them.
      const size = p.sizes.length > 0 && l.size && p.sizes.includes(l.size) ? l.size : undefined;
      priced.push({ slug: p.slug, name: p.name, price: p.price, size, quantity: l.quantity });
    }
  }
  return { priced, corrections };
}

// Atomically takes stock for every product in one statement. Returns false (and
// gives back anything it did take) if any product no longer has enough.
export async function reserveStock(lines: OrderLine[]): Promise<boolean> {
  const totals = totalsBySlug(lines);
  const slugs = [...totals.keys()];
  const qtys = slugs.map((s) => totals.get(s)!);

  const taken = (await getSql().query(
    `WITH req AS (SELECT * FROM unnest($1::text[], $2::int[]) AS t(slug, qty))
     UPDATE products p SET quantity = p.quantity - req.qty, updated_at = now()
     FROM req
     WHERE p.slug = req.slug AND p.status = 'live' AND p.quantity >= req.qty
     RETURNING p.slug`,
    [slugs, qtys]
  )) as { slug: string }[];

  if (taken.length === slugs.length) return true;

  // Lost a race with another order (or an admin change): undo the partial take.
  const takenSlugs = taken.map((t) => t.slug);
  await restoreStock(lines.filter((l) => takenSlugs.includes(l.slug)));
  return false;
}

export async function restoreStock(lines: OrderLine[]): Promise<void> {
  const totals = totalsBySlug(lines);
  if (totals.size === 0) return;
  const slugs = [...totals.keys()];
  const qtys = slugs.map((s) => totals.get(s)!);
  await getSql().query(
    `WITH req AS (SELECT * FROM unnest($1::text[], $2::int[]) AS t(slug, qty))
     UPDATE products p SET quantity = p.quantity + req.qty, updated_at = now()
     FROM req WHERE p.slug = req.slug`,
    [slugs, qtys]
  );
}
