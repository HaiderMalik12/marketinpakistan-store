const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "923057252013";

export function getWhatsAppLink(message: string): string {
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`;
}

export function buildGeneralInquiryMessage(src?: string | null): string {
  const base = "Assalam o Alaikum! Mujhe apne order/product ke baare mein sawal hai.";
  return src ? `${base}\n\n[ref: ${src}]` : base;
}
