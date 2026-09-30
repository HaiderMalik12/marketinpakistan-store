import { Resend } from "resend";
import type { CartItem } from "@/app/lib/cart";
import { formatDeliveryCharge, priceBreakdown } from "@/app/lib/pricing";
import { checkLines, parseLines, reserveStock, restoreStock } from "@/app/lib/orders";

// Only slug/size/quantity are trusted from the browser. Anything else in an item
// (name, price) is ignored; the server re-reads it from the database.
type OrderRequestBody = {
  items: unknown;
  customer: {
    name: string;
    phone: string;
    email?: string;
    address: string;
    city: string;
  };
  src?: string | null;
};

function generateOrderId(): string {
  const date = new Date();
  const stamp = `${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `MIP-${stamp}-${random}`;
}

function formatOrderText(
  orderId: string,
  body: OrderRequestBody,
  items: CartItem[],
  { subtotal, delivery, total }: { subtotal: number; delivery: number; total: number }
): string {
  const lines = items.map(
    (item) =>
      `- ${item.name}${item.size ? ` (${item.size})` : ""} x${item.quantity} — PKR ${(
        item.price * item.quantity
      ).toLocaleString()}`
  );

  return [
    `Order ${orderId}`,
    "",
    `Customer: ${body.customer.name}`,
    `Phone: ${body.customer.phone}`,
    body.customer.email ? `Email: ${body.customer.email}` : null,
    `Address: ${body.customer.address}, ${body.customer.city}`,
    body.src ? `Source: ${body.src}` : null,
    "",
    "Items:",
    ...lines,
    "",
    `Subtotal: PKR ${subtotal.toLocaleString()}`,
    `Delivery: ${formatDeliveryCharge(delivery)}`,
    `Total: PKR ${total.toLocaleString()}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export async function POST(request: Request) {
  let body: OrderRequestBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const lines = parseLines(body?.items);
  if (
    !body?.customer?.name ||
    !body?.customer?.phone ||
    !body?.customer?.address ||
    !body?.customer?.city ||
    !lines
  ) {
    return Response.json({ error: "Missing required order fields" }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const notificationEmail = process.env.ORDER_NOTIFICATION_EMAIL;
  const fromEmail = process.env.ORDER_FROM_EMAIL ?? "onboarding@resend.dev";

  // Checked before touching stock, so a misconfigured server never takes stock.
  if (!apiKey || !notificationEmail) {
    console.error("RESEND_API_KEY or ORDER_NOTIFICATION_EMAIL not configured — order was NOT emailed.");
    return Response.json(
      { error: "Order notification is not configured yet. Please contact us on WhatsApp instead." },
      { status: 500 }
    );
  }

  // Prices the customer saw, so a changed price is confirmed rather than silently charged.
  const clientPrices = new Map<string, number>();
  for (const raw of Array.isArray(body.items) ? body.items : []) {
    const { slug, price } = (raw ?? {}) as { slug?: unknown; price?: unknown };
    if (typeof slug === "string" && typeof price === "number") clientPrices.set(slug, price);
  }

  const { priced, corrections } = await checkLines(lines, clientPrices);
  if (corrections.length > 0) {
    return Response.json(
      { error: "Some items in your cart have changed.", corrections },
      { status: 409 }
    );
  }

  if (!(await reserveStock(lines))) {
    // Someone else took the last one between the check and the reservation.
    const recheck = await checkLines(lines, clientPrices);
    return Response.json(
      { error: "Some items in your cart have changed.", corrections: recheck.corrections },
      { status: 409 }
    );
  }

  const { subtotal, delivery, total } = priceBreakdown(priced);
  const orderId = generateOrderId();
  const orderText = formatOrderText(orderId, body, priced, { subtotal, delivery, total });

  const resend = new Resend(apiKey);

  let sendError: unknown = null;
  try {
    const ownerSend = await resend.emails.send({
      from: fromEmail,
      to: notificationEmail,
      subject: `New order ${orderId} — ${body.customer.name}`,
      text: orderText,
    });
    sendError = ownerSend.error;
  } catch (error) {
    sendError = error;
  }

  if (sendError) {
    console.error("Failed to send owner order notification email:", sendError);
    // The order was not delivered to the business, so give the stock back.
    await restoreStock(lines);
    return Response.json(
      { error: "Could not send order notification. Please contact us on WhatsApp instead." },
      { status: 502 }
    );
  }

  // Best-effort customer confirmation — will silently fail until the sending domain
  // is verified with Resend (until then, Resend only delivers to the account owner's
  // own address), so this is not allowed to block the order itself.
  if (body.customer.email) {
    try {
      await resend.emails.send({
        from: fromEmail,
        to: body.customer.email,
        subject: `Your marketinpakistan order ${orderId}`,
        text: `Thank you for your order!\n\n${orderText}\n\nWe'll confirm your order on WhatsApp shortly.`,
      });
    } catch (error) {
      console.error("Customer confirmation email failed (non-blocking):", error);
    }
  }

  return Response.json({ orderId, total }, { status: 201 });
}
