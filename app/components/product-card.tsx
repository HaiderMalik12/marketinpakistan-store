import Link from "next/link";
import type { Product } from "@/app/lib/products";
import { optimizedImage } from "@/app/lib/images";

export function ProductCard({ product }: { product: Product }) {
  const soldOut = product.quantity <= 0;
  const photoCount = product.images.length;

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
        {photoCount > 1 && (
          <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 bg-gray-900/80 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <circle cx="9" cy="10" r="1.5" />
              <path d="M21 16l-5-5-9 9" />
            </svg>
            {photoCount} photos
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
