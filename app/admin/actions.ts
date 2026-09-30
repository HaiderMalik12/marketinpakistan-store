"use server";

import { createHash, timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSession, destroySession, requireAdmin } from "@/app/lib/session";
import { isOurCloudinaryUrl } from "@/app/lib/cloudinary";
import {
  createProduct,
  deleteProduct,
  getProductById,
  listCollections,
  setProductStatus,
  updateProduct,
  type ProductInput,
} from "@/app/lib/products";

export type LoginState = { error?: string };

function passwordsMatch(input: string, expected: string): boolean {
  // Hash both so lengths are equal and the comparison is constant-time.
  const a = createHash("sha256").update(input).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return { error: "Admin login is not configured." };

  const password = String(formData.get("password") ?? "");
  if (!password || !passwordsMatch(password, expected)) {
    // Slow down guessing; serverless has no shared memory for a real rate limit.
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return { error: "Wrong password." };
  }

  await createSession();
  redirect("/admin");
}

export async function logout() {
  await destroySession();
  redirect("/admin/login");
}

// ---- Products ----

export type ProductFormState = {
  errors?: Partial<Record<"name" | "description" | "price" | "quantity" | "collection" | "catalog" | "images", string>>;
  message?: string;
};

function refreshStore() {
  // Store pages are statically cached for up to 5 minutes; make saves show at once.
  revalidatePath("/", "layout");
}

function parseInt0(value: FormDataEntryValue | null): number {
  const s = String(value ?? "").trim();
  return /^\d+$/.test(s) ? Number(s) : NaN;
}

export async function saveProduct(
  _prev: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  await requireAdmin();

  const idRaw = String(formData.get("id") ?? "");
  const id = idRaw ? Number(idRaw) : null;
  const intent = String(formData.get("intent") ?? "publish"); // publish | draft | keep

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const catalog = String(formData.get("catalog") ?? "").trim();
  const collection = String(formData.get("collection") ?? "").trim();
  const price = parseInt0(formData.get("price"));
  const quantity = parseInt0(formData.get("quantity"));

  let images: string[] = [];
  try {
    const parsed = JSON.parse(String(formData.get("images") ?? "[]"));
    if (Array.isArray(parsed)) images = parsed.filter((u): u is string => typeof u === "string");
  } catch {
    // treated as no images below
  }

  const errors: NonNullable<ProductFormState["errors"]> = {};
  if (!name) errors.name = "Enter a title.";
  else if (name.length > 120) errors.name = "Title is too long (120 characters max).";
  if (description.length > 2000) errors.description = "Description is too long.";
  if (!Number.isInteger(price) || price < 0 || price > 10_000_000) {
    errors.price = "Enter the price as a whole number, e.g. 3000.";
  }
  if (!Number.isInteger(quantity) || quantity < 0 || quantity > 100_000) {
    errors.quantity = "Enter the quantity as a whole number, e.g. 10.";
  }
  if (catalog.length > 60) errors.catalog = "Volume is too long.";
  if (images.length < 1) errors.images = "Add at least one photo.";
  else if (images.length > 8) errors.images = "Up to 8 photos.";
  else if (!images.every(isOurCloudinaryUrl)) errors.images = "A photo link is not valid. Remove it and upload again.";

  const collections = await listCollections();
  if (!collections.some((c) => c.slug === collection)) errors.collection = "Choose a collection.";

  if (Object.keys(errors).length > 0) return { errors };

  const existing = id ? await getProductById(id) : null;
  if (id && !existing) return { message: "This product no longer exists." };

  const status: "live" | "hidden" =
    intent === "draft" ? "hidden" : intent === "keep" && existing ? existing.status : "live";

  const input: ProductInput = {
    name,
    description,
    price,
    quantity,
    catalog,
    collections: [collection],
    images,
    sizes: existing?.sizes ?? [],
    status,
  };

  if (id) await updateProduct(id, input);
  else await createProduct(input);

  refreshStore();
  redirect("/admin");
}

export async function toggleProductStatus(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const next = formData.get("next") === "hidden" ? "hidden" : "live";
  if (!Number.isInteger(id)) return;
  await setProductStatus(id, next);
  refreshStore();
  revalidatePath("/admin");
}

export async function removeProduct(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;
  await deleteProduct(id);
  refreshStore();
  revalidatePath("/admin");
}
