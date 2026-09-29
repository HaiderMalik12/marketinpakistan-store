import type { CartItem } from "@/app/lib/cart";

export function cartSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

const DELIVERY_TIERS: { maxQuantity: number; charge: number }[] = [
  { maxQuantity: 1, charge: 300 },
  { maxQuantity: 4, charge: 350 },
];

export function calculateDeliveryCharge(items: CartItem[]): number {
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  if (totalQuantity <= 0) return 0;
  const tier = DELIVERY_TIERS.find((t) => totalQuantity <= t.maxQuantity);
  return tier ? tier.charge : 0; // 5+ dresses: free, uncapped
}

export function formatDeliveryCharge(delivery: number): string {
  return delivery === 0 ? "Free" : `PKR ${delivery.toLocaleString()}`;
}

export function priceBreakdown(items: CartItem[]): {
  subtotal: number;
  delivery: number;
  total: number;
} {
  const subtotal = cartSubtotal(items);
  const delivery = calculateDeliveryCharge(items);
  return { subtotal, delivery, total: subtotal + delivery };
}
