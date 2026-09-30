import "server-only";
import { getSql } from "@/app/lib/db";

export type Product = {
  id: string;
  slug: string;
  name: string;
  catalog: string;
  collections: string[];
  price: number;
  images: string[];
  sizes: string[];
  description: string;
  quantity: number;
  status: "live" | "hidden";
};

export type Collection = {
  slug: string;
  title: string;
  tagline: string;
};

type ProductRow = Omit<Product, "id"> & { id: number };

function toProduct(row: ProductRow): Product {
  return { ...row, id: String(row.id) };
}

async function query(text: string, params: unknown[] = []): Promise<ProductRow[]> {
  return (await getSql().query(text, params)) as ProductRow[];
}

// Storefront: only live products.
export async function listLiveProducts(): Promise<Product[]> {
  const rows = await query("SELECT * FROM products WHERE status = 'live' ORDER BY id");
  return rows.map(toProduct);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const rows = await query("SELECT * FROM products WHERE slug = $1 AND status = 'live'", [slug]);
  return rows[0] ? toProduct(rows[0]) : null;
}

export async function getCollectionProducts(collectionSlug: string): Promise<Product[]> {
  const rows = await query(
    "SELECT * FROM products WHERE status = 'live' AND $1 = ANY(collections) ORDER BY id",
    [collectionSlug]
  );
  return rows.map(toProduct);
}

export async function getCollection(slug: string): Promise<Collection | null> {
  const rows = (await getSql().query(
    "SELECT slug, title, tagline FROM collections WHERE slug = $1",
    [slug]
  )) as Collection[];
  return rows[0] ?? null;
}

export async function listCollections(): Promise<Collection[]> {
  return (await getSql().query(
    "SELECT slug, title, tagline FROM collections ORDER BY sort, title"
  )) as Collection[];
}

// Admin: everything, including hidden.
export async function listAllProducts(): Promise<Product[]> {
  const rows = await query("SELECT * FROM products ORDER BY id DESC");
  return rows.map(toProduct);
}

export async function getProductById(id: number): Promise<Product | null> {
  const rows = await query("SELECT * FROM products WHERE id = $1", [id]);
  return rows[0] ? toProduct(rows[0]) : null;
}

export type ProductInput = {
  name: string;
  description: string;
  price: number;
  quantity: number;
  catalog: string;
  collections: string[];
  images: string[];
  sizes?: string[];
  status?: "live" | "hidden";
};

export function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "product"
  );
}

async function uniqueSlug(name: string): Promise<string> {
  const base = slugify(name);
  const rows = (await getSql().query("SELECT slug FROM products WHERE slug LIKE $1", [
    `${base}%`,
  ])) as { slug: string }[];
  const taken = new Set(rows.map((r) => r.slug));
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

export async function createProduct(input: ProductInput): Promise<Product> {
  const slug = await uniqueSlug(input.name);
  const rows = await query(
    `INSERT INTO products (slug, name, description, price, quantity, catalog, collections, images, sizes, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
    [
      slug,
      input.name,
      input.description,
      input.price,
      input.quantity,
      input.catalog,
      input.collections,
      input.images,
      input.sizes ?? [],
      input.status ?? "live",
    ]
  );
  return toProduct(rows[0]);
}

// Slug is never changed on edit so shared links keep working.
export async function updateProduct(id: number, input: ProductInput): Promise<Product | null> {
  const rows = await query(
    `UPDATE products SET name = $2, description = $3, price = $4, quantity = $5, catalog = $6,
       collections = $7, images = $8, sizes = $9, status = $10, updated_at = now()
     WHERE id = $1 RETURNING *`,
    [
      id,
      input.name,
      input.description,
      input.price,
      input.quantity,
      input.catalog,
      input.collections,
      input.images,
      input.sizes ?? [],
      input.status ?? "live",
    ]
  );
  return rows[0] ? toProduct(rows[0]) : null;
}

export async function setProductStatus(id: number, status: "live" | "hidden"): Promise<void> {
  await getSql().query("UPDATE products SET status = $2, updated_at = now() WHERE id = $1", [
    id,
    status,
  ]);
}

export async function deleteProduct(id: number): Promise<void> {
  await getSql().query("DELETE FROM products WHERE id = $1", [id]);
}

// Any status: the order route needs to tell "hidden/deleted" apart from "in stock".
export async function getProductsBySlugs(slugs: string[]): Promise<Product[]> {
  if (slugs.length === 0) return [];
  const rows = await query("SELECT * FROM products WHERE slug = ANY($1::text[])", [slugs]);
  return rows.map(toProduct);
}
