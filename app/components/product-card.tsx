import Link from "next/link";
import type { Product } from "@/app/data/products";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/product/${product.slug}`}
      className="border rounded-xl overflow-hidden shadow-sm block hover:shadow-md transition-shadow"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={product.images[0]}
        alt={product.name}
        className="w-full h-64 object-cover"
      />
      <div className="p-4">
        <h3 className="font-semibold text-gray-800">{product.name}</h3>
        <p className="text-gray-500 text-sm">{product.catalog}</p>
        <p className="text-rose-600 font-bold text-lg mt-1">
          PKR {product.price.toLocaleString()}
        </p>
      </div>
    </Link>
  );
}
