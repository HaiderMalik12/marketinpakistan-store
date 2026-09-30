import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductForm } from "@/app/components/admin/product-form";
import { requireAdmin } from "@/app/lib/session";
import { getProductById, listCollections } from "@/app/lib/products";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();

  const [product, collections] = await Promise.all([getProductById(Number(id)), listCollections()]);
  if (!product) notFound();

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-800">&larr; Products</Link>
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2 mb-6">Edit product</h1>
      <ProductForm key={product.id} collections={collections} product={product} />
    </main>
  );
}
