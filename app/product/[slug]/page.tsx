import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { products } from "@/app/data/products";
import { AddToCartForm } from "@/app/components/add-to-cart-form";

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata(
  props: PageProps<"/product/[slug]">
): Promise<Metadata> {
  const { slug } = await props.params;
  const product = products.find((p) => p.slug === slug);
  if (!product) return {};

  return {
    title: `${product.name} — marketinpakistan`,
    description: product.description,
    openGraph: {
      title: `${product.name} — marketinpakistan`,
      description: product.description,
      images: [{ url: product.images[0] }],
    },
  };
}

export default async function ProductPage(props: PageProps<"/product/[slug]">) {
  const { slug } = await props.params;
  const product = products.find((p) => p.slug === slug);

  if (!product) {
    notFound();
  }

  return (
    <main className="flex-1 max-w-4xl mx-auto px-4 py-12 w-full">
      <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
        &larr; Back to collection
      </Link>

      <div className="mt-6 grid md:grid-cols-2 gap-10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.images[0]}
          alt={product.name}
          className="w-full rounded-xl object-cover"
        />

        <div>
          <p className="text-sm text-gray-500">{product.catalog}</p>
          <h1 className="text-3xl font-bold text-gray-800 mt-1">{product.name}</h1>
          <p className="text-rose-600 font-bold text-2xl mt-3">
            PKR {product.price.toLocaleString()}
          </p>
          <p className="text-gray-600 mt-6 leading-relaxed">{product.description}</p>

          <div className="mt-8">
            <AddToCartForm
              slug={product.slug}
              name={product.name}
              price={product.price}
              sizes={product.sizes}
            />
          </div>
          <p className="text-gray-400 text-sm mt-4">
            📦 Cash on Delivery — Pakistan wide &nbsp;|&nbsp; 🏭 Direct from our
            Faisalabad factory
          </p>
        </div>
      </div>
    </main>
  );
}
