import { Resend } from "resend";
import type { CartItem } from "@/app/lib/cart";
import { formatDeliveryCharge, priceBreakdown } from "@/app/lib/pricing";

type OrderRequestBody = {
  items: CartItem[];
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
  { subtotal, delivery, total }: { subtotal: number; delivery: number; total: number }
): string {
  const lines = body.items.map(
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

  if (
    !body?.customer?.name ||
    !body?.customer?.phone ||
    !body?.customer?.address ||
    !body?.customer?.city ||
    !Array.isArray(body.items) ||
    body.items.length === 0
  ) {
    return Response.json({ error: "Missing required order fields" }, { status: 400 });
  }

  const { subtotal, delivery, total } = priceBreakdown(body.items);
  const orderId = generateOrderId();
  const orderText = formatOrderText(orderId, body, { subtotal, delivery, total });

  const apiKey = process.env.RESEND_API_KEY;
  const notificationEmail = process.env.ORDER_NOTIFICATION_EMAIL;
  const fromEmail = process.env.ORDER_FROM_EMAIL ?? "onboarding@resend.dev";

  if (!apiKey || !notificationEmail) {
    console.error(
      "RESEND_API_KEY or ORDER_NOTIFICATION_EMAIL not configured — order was NOT emailed.",
      orderText
    );
    return Response.json(
      { error: "Order notification is not configured yet. Please contact us on WhatsApp instead." },
      { status: 500 }
    );
  }

  const resend = new Resend(apiKey);

  const ownerSend = await resend.emails.send({
    from: fromEmail,
    to: notificationEmail,
    subject: `New order ${orderId} — ${body.customer.name}`,
    text: orderText,
  });

  if (ownerSend.error) {
    console.error("Failed to send owner order notification email:", ownerSend.error);
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

  return Response.json({ orderId }, { status: 201 });
}
