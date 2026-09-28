"use client";

import type { MouseEvent, ReactNode } from "react";
import { buildGeneralInquiryMessage, getWhatsAppLink } from "@/app/lib/whatsapp";
import { getStoredSource } from "@/app/lib/attribution";

export function GeneralWhatsAppButton({
  className,
  children,
}: {
  className?: string;
  children?: ReactNode;
}) {
  const baseHref = getWhatsAppLink(buildGeneralInquiryMessage());

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    const src = getStoredSource();
    if (!src) return;
    event.preventDefault();
    window.open(
      getWhatsAppLink(buildGeneralInquiryMessage(src)),
      "_blank",
      "noopener,noreferrer"
    );
  }

  return (
    <a href={baseHref} onClick={handleClick} target="_blank" rel="noopener noreferrer" className={className}>
      {children ?? "Chat with us on WhatsApp"}
    </a>
  );
}
