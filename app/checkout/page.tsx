"use client";

import Link from "next/link";
import { useState, type SubmitEvent } from "react";
import { clearCart, useCart } from "@/app/lib/cart";
import { priceBreakdown } from "@/app/lib/pricing";
import { getStoredSource } from "@/app/lib/attribution";
import { GeneralWhatsAppButton } from "@/app/components/general-whatsapp-button";
import { PriceBreakdown } from "@/app/components/price-breakdown";

export default function CheckoutPage() {
  const items = useCart();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [confirmedTotal, setConfirmedTotal] = useState<number | null>(null);

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    setStatus("submitting");
    setErrorMessage("");

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          customer: { name, phone, email: email || undefined, address, city },
          src: getStoredSource(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setStatus("error");
        setErrorMessage(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      setConfirmedTotal(total);
      setOrderId(data.orderId);
      clearCart();
    } catch {
      setStatus("error");
      setErrorMessage("Could not reach the server. Please check your connection and try again.");
    }
  }

  if (orderId) {
    return (
      <main className="flex-1 max-w-xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-3">Order received!</h1>
        <p className="text-gray-600 mb-1">Order ID: {orderId}</p>
        {confirmedTotal !== null && (
          <p className="text-gray-600 mb-1">Total: PKR {confirmedTotal.toLocaleString()}</p>
        )}
        <p className="text-gray-600 mb-8">
          We&apos;ll confirm your order and delivery details shortly. Cash on Delivery.
        </p>
        <GeneralWhatsAppButton className="inline-block bg-green-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-green-700 transition-colors">
          Chat with us on WhatsApp
        </GeneralWhatsAppButton>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="flex-1 max-w-xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Your cart is empty</h1>
        <Link href="/" className="text-rose-600 font-medium hover:underline">
          Browse the collection
        </Link>
      </main>
    );
  }

  const { subtotal, delivery, total } = priceBreakdown(items);

  return (
    <main className="flex-1 max-w-xl mx-auto px-4 py-12 w-full">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Checkout</h1>
      <p className="text-gray-500 mb-2">Cash on Delivery</p>
      <div className="mb-8">
        <PriceBreakdown subtotal={subtotal} delivery={delivery} total={total} compact />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm text-gray-600 mb-1">
            Full name
          </label>
          <input
            id="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border rounded-lg px-3 py-2 w-full"
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm text-gray-600 mb-1">
            Phone (required — we&apos;ll confirm on WhatsApp)
          </label>
          <input
            id="phone"
            required
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="border rounded-lg px-3 py-2 w-full"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm text-gray-600 mb-1">
            Email (optional)
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border rounded-lg px-3 py-2 w-full"
          />
        </div>

        <div>
          <label htmlFor="address" className="block text-sm text-gray-600 mb-1">
            Delivery address
          </label>
          <textarea
            id="address"
            required
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="border rounded-lg px-3 py-2 w-full"
            rows={3}
          />
        </div>

        <div>
          <label htmlFor="city" className="block text-sm text-gray-600 mb-1">
            City
          </label>
          <input
            id="city"
            required
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="border rounded-lg px-3 py-2 w-full"
          />
        </div>

        {status === "error" && (
          <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3">
            {errorMessage}{" "}
            <GeneralWhatsAppButton className="underline font-medium">
              Order on WhatsApp instead
            </GeneralWhatsAppButton>
          </div>
        )}

        <button
          type="submit"
          disabled={status === "submitting"}
          className="w-full bg-rose-600 text-white py-3 rounded-full font-semibold hover:bg-rose-700 transition-colors disabled:opacity-50"
        >
          {status === "submitting" ? "Placing order..." : "Place Order"}
        </button>
      </form>
    </main>
  );
}
