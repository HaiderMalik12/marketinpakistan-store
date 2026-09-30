import Link from "next/link";
import type { Product } from "@/app/lib/products";
import { optimizedImage } from "@/app/lib/images";

export function ProductCard({ product }: { product: Product }) {
  const soldOut = product.quantity <= 0;

  return (
    <Link
      href={`/product/${product.slug}`}
      className="border rounded-xl overflow-hidden shadow-sm block hover:shadow-md transition-shadow"
    >
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={optimizedImage(product.images[0], 600)}
          alt={product.name}
          className={`w-full h-64 object-cover ${soldOut ? "opacity-60" : ""}`}
        />
        {soldOut && (
          <span className="absolute top-3 left-3 bg-gray-900 text-white text-xs font-semibold px-3 py-1 rounded-full">
            Sold out
          </span>
        )}
      </div>
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
