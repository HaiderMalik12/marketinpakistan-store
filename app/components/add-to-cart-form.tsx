"use client";

import { useRouter } from "next/navigation";
import { useState, type SubmitEvent } from "react";
import { addToCart } from "@/app/lib/cart";

export function AddToCartForm({
  slug,
  name,
  price,
  sizes,
  maxQuantity,
}: {
  slug: string;
  name: string;
  price: number;
  sizes: string[];
  maxQuantity: number;
}) {
  const router = useRouter();
  const [size, setSize] = useState(sizes[0] ?? "");
  const [quantity, setQuantity] = useState(1);

  function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    addToCart({
      slug,
      name,
      price,
      size: sizes.length > 0 ? size : undefined,
      quantity,
    });
    router.push("/cart");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {sizes.length > 0 && (
        <div>
          <label htmlFor="size" className="block text-sm text-gray-600 mb-1">
            Size
          </label>
          <select
            id="size"
            value={size}
            onChange={(e) => setSize(e.target.value)}
            className="border rounded-lg px-3 py-2 w-full max-w-[160px]"
          >
            {sizes.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label htmlFor="quantity" className="block text-sm text-gray-600 mb-1">
          Quantity
        </label>
        <input
          id="quantity"
          type="number"
          min={1}
          max={maxQuantity}
          value={quantity}
          onChange={(e) =>
            setQuantity(Math.min(maxQuantity, Math.max(1, Number(e.target.value) || 1)))
          }
          className="border rounded-lg px-3 py-2 w-24"
        />
      </div>

      <button
        type="submit"
        className="inline-block bg-rose-600 text-white text-center px-8 py-3 rounded-full font-semibold hover:bg-rose-700 transition-colors"
      >
        Add to Cart
      </button>
    </form>
  );
}
