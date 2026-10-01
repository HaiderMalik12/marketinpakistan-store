"use client";

import Link from "next/link";
import { removeFromCart, updateQuantity, useCart } from "@/app/lib/cart";
import { priceBreakdown } from "@/app/lib/pricing";
import { QuantityInput } from "@/app/components/quantity-input";
import { PriceBreakdown } from "@/app/components/price-breakdown";

export default function CartPage() {
  const items = useCart();

  if (items.length === 0) {
    return (
      <main className="flex-1 max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Your cart is empty</h1>
        <Link href="/" className="text-rose-600 font-medium hover:underline">
          Browse the collection
        </Link>
      </main>
    );
  }

  const { subtotal, delivery, total } = priceBreakdown(items);

  return (
    <main className="flex-1 max-w-2xl mx-auto px-4 py-12 w-full">
      <h1 className="text-2xl font-bold text-gray-800 mb-8">Your Cart</h1>

      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={`${item.slug}-${item.size ?? "nosize"}`}
            className="flex items-center justify-between border-b pb-4"
          >
            <div>
              <p className="font-semibold text-gray-800">{item.name}</p>
              {item.size && <p className="text-sm text-gray-500">Size: {item.size}</p>}
              <p className="text-sm text-gray-500">PKR {item.price.toLocaleString()} each</p>
            </div>
            <div className="flex items-center gap-3">
              <QuantityInput
                value={item.quantity}
                onChange={(q) => updateQuantity(item.slug, item.size, q)}
                className="border rounded-lg px-2 py-1 w-16 text-center"
              />
              <button
                onClick={() => removeFromCart(item.slug, item.size)}
                className="text-sm text-gray-400 hover:text-red-600"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <PriceBreakdown subtotal={subtotal} delivery={delivery} total={total} />
      </div>

      <Link
        href="/checkout"
        className="mt-6 block text-center bg-rose-600 text-white py-3 rounded-full font-semibold hover:bg-rose-700 transition-colors"
      >
        Proceed to Checkout
      </Link>
    </main>
  );
}
