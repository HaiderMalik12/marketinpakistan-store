import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCollection, getCollectionProducts } from "@/app/lib/products";
import { ProductCard } from "@/app/components/product-card";

const SLUG = "winter-clearance";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const collection = await getCollection(SLUG);
  if (!collection) return {};
  return {
    title: `${collection.title} — marketinpakistan`,
    description: collection.tagline,
    openGraph: {
      title: `${collection.title} — marketinpakistan`,
      description: collection.tagline,
    },
  };
}

export default async function WinterClearancePage() {
  const [collection, items] = await Promise.all([
    getCollection(SLUG),
    getCollectionProducts(SLUG),
  ]);
  if (!collection) notFound();

  const volumes = [...new Set(items.map((p) => p.catalog))];

  return (
    <main className="flex-1 max-w-6xl mx-auto px-4 py-12 w-full">
      <p className="text-rose-600 font-semibold text-sm uppercase tracking-wide">
        Winter collection
      </p>
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mt-1">
        {collection.title}
      </h1>
      <p className="text-gray-600 mt-2 mb-10">{collection.tagline}</p>

      {volumes.map((volume) => (
        <section key={volume} className="mb-12">
          {volume && <h2 className="text-xl font-bold text-gray-800 mb-4">{volume}</h2>}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {items
              .filter((p) => p.catalog === volume)
              .map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
          </div>
        </section>
      ))}
    </main>
  );
}
