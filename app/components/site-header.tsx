"use client";

import Link from "next/link";
import { useCart } from "@/app/lib/cart";
import { GeneralWhatsAppButton } from "@/app/components/general-whatsapp-button";

export function SiteHeader() {
  const items = useCart();
  const count = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="border-b bg-white sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-bold text-lg text-gray-800">
          marketinpakistan
        </Link>
        <div className="flex items-center gap-5">
          <GeneralWhatsAppButton className="text-sm text-gray-500 hover:text-green-600 transition-colors hidden sm:inline">
            Need help? Chat on WhatsApp
          </GeneralWhatsAppButton>
          <Link href="/cart" className="text-sm font-medium text-gray-800">
            Cart{count > 0 ? ` (${count})` : ""}
          </Link>
        </div>
      </div>
    </header>
  );
}
