"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/app/lib/cart";
import { GeneralWhatsAppButton } from "@/app/components/general-whatsapp-button";
import { LogoWithText } from "@/app/components/logo";

export function SiteHeader() {
  const items = useCart();
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  const pathname = usePathname();
  // Menu is open only for the route it was opened on, so any navigation
  // (including browser back/forward) closes it without an effect.
  const [openPath, setOpenPath] = useState<string | null>(null);
  const open = openPath === pathname;
  const close = () => setOpenPath(null);

  const linkClass = "text-sm font-medium text-gray-800 hover:text-rose-600 transition-colors";
  const saleClass = "text-sm font-semibold text-rose-600 hover:text-rose-700 transition-colors";
  const helpClass = "text-sm text-gray-500 hover:text-green-600 transition-colors";
  const cartLabel = `Cart (${count})`;

  return (
    <header className="border-b bg-white sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" onClick={close} className="hover:opacity-80 transition-opacity">
          <LogoWithText />
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link href="/winter-clearance" className={saleClass}>
            Winter Clearance Sale
          </Link>
          <Link href="/" className={linkClass}>
            Home
          </Link>
          <GeneralWhatsAppButton className={helpClass}>
            Need help? Chat on WhatsApp
          </GeneralWhatsAppButton>
          {count > 0 && (
            <Link href="/cart" className={linkClass}>
              {cartLabel}
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-4 md:hidden">
          {count > 0 && (
            <Link href="/cart" onClick={close} className={linkClass}>
              {cartLabel}
            </Link>
          )}
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpenPath(open ? null : pathname)}
            className="p-2 -mr-2 text-gray-800"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              {open ? (
                <path d="M6 6l12 12M18 6L6 18" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-menu" className="md:hidden border-t bg-white px-4 py-4 flex flex-col gap-4">
          <Link href="/winter-clearance" onClick={close} className={saleClass}>
            Winter Clearance Sale
          </Link>
          <Link href="/" onClick={close} className={linkClass}>
            Home
          </Link>
          <GeneralWhatsAppButton className={helpClass} onClick={close}>
            Need help? Chat on WhatsApp
          </GeneralWhatsAppButton>
        </nav>
      )}
    </header>
  );
}
