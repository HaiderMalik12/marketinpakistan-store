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
