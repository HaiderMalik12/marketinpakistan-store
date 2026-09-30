import Link from "next/link";
import { ProductForm } from "@/app/components/admin/product-form";
import { requireAdmin } from "@/app/lib/session";
import { listCollections } from "@/app/lib/products";

export default async function NewProductPage() {
  await requireAdmin();
  const collections = await listCollections();

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-800">&larr; Products</Link>
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2 mb-6">Add product</h1>
      <ProductForm collections={collections} />
    </main>
  );
}
