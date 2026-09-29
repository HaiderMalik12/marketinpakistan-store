import { formatDeliveryCharge } from "@/app/lib/pricing";

export function PriceBreakdown({
  subtotal,
  delivery,
  total,
  compact = false,
}: {
  subtotal: number;
  delivery: number;
  total: number;
  compact?: boolean;
}) {
  const rowClass = compact ? "flex justify-between" : "flex items-center justify-between text-gray-600";
  const totalClass = compact
    ? "flex justify-between font-semibold text-gray-800"
    : "flex items-center justify-between pt-2 border-t text-lg font-semibold text-gray-800";

  return (
    <div className={compact ? "space-y-1 text-sm text-gray-600" : "space-y-2"}>
      <div className={rowClass}>
        <span>Subtotal</span>
        <span>PKR {subtotal.toLocaleString()}</span>
      </div>
      <div className={rowClass}>
        <span>Delivery</span>
        <span>{formatDeliveryCharge(delivery)}</span>
      </div>
      <div className={totalClass}>
        <span>Total</span>
        <span>PKR {total.toLocaleString()}</span>
      </div>
    </div>
  );
}
