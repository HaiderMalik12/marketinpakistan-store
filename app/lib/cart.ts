"use client";

import { useSyncExternalStore } from "react";

export type CartItem = {
  slug: string;
  name: string;
  price: number;
  size?: string;
  quantity: number;
};

const STORAGE_KEY = "mip_cart";
const EMPTY_CART: CartItem[] = [];
type Listener = () => void;
const listeners = new Set<Listener>();
let cache: CartItem[] | null = null;

function readFromStorage(): CartItem[] {
  if (typeof window === "undefined") return EMPTY_CART;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : EMPTY_CART;
  } catch {
    return EMPTY_CART;
  }
}

function writeToStorage(items: CartItem[]) {
  cache = items;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // localStorage unavailable — cart still works for this session via `cache`
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): CartItem[] {
  if (cache === null) cache = readFromStorage();
  return cache;
}

function getServerSnapshot(): CartItem[] {
  return EMPTY_CART;
}

export function useCart(): CartItem[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function addToCart(item: CartItem) {
  const items = getSnapshot();
  const idx = items.findIndex((i) => i.slug === item.slug && i.size === item.size);
  const next =
    idx >= 0
      ? items.map((i, index) =>
          index === idx ? { ...i, quantity: i.quantity + item.quantity } : i
        )
      : [...items, item];
  writeToStorage(next);
}

export function removeFromCart(slug: string, size: string | undefined) {
  writeToStorage(getSnapshot().filter((i) => !(i.slug === slug && i.size === size)));
}

export function updateQuantity(slug: string, size: string | undefined, quantity: number) {
  if (quantity < 1) {
    removeFromCart(slug, size);
    return;
  }
  writeToStorage(
    getSnapshot().map((i) => (i.slug === slug && i.size === size ? { ...i, quantity } : i))
  );
}

export function clearCart() {
  writeToStorage([]);
}

export type CartCorrection = {
  slug: string;
  name: string;
  reason: "gone" | "stock" | "price";
  available?: number;
  price?: number;
};

// Applies the server's view of the cart (from a 409 on checkout) and returns a
// plain-language line for each change, so the customer knows what happened.
export function reconcileCart(corrections: CartCorrection[]): string[] {
  const messages: string[] = [];
  let items = getSnapshot();

  for (const c of corrections) {
    if (c.reason === "gone") {
      const name = items.find((i) => i.slug === c.slug)?.name ?? c.name;
      items = items.filter((i) => i.slug !== c.slug);
      messages.push(`${name} is no longer available and was removed.`);
    } else if (c.reason === "stock") {
      let left = c.available ?? 0;
      items = items
        .map((i) => {
          if (i.slug !== c.slug) return i;
          const kept = Math.min(i.quantity, left);
          left -= kept;
          return { ...i, quantity: kept };
        })
        .filter((i) => i.quantity > 0);
      messages.push(
        (c.available ?? 0) > 0
          ? `Only ${c.available} of ${c.name} left, so the quantity was reduced.`
          : `${c.name} just sold out and was removed.`
      );
    } else if (c.reason === "price" && c.price !== undefined) {
      items = items.map((i) => (i.slug === c.slug ? { ...i, price: c.price! } : i));
      messages.push(`The price of ${c.name} changed to PKR ${c.price.toLocaleString()}.`);
    }
  }

  writeToStorage(items);
  return messages;
}
