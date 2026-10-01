"use client";

import { useState } from "react";

// Keeps the raw text while the customer types so the field can be emptied and
// retyped (a controlled number input that snaps "" back to 1 turns "1" + "2"
// into "12", which then gets clamped to stock). Normalises on blur.
export function QuantityInput({
  id,
  value,
  onChange,
  max,
  className,
}: {
  id?: string;
  value: number;
  onChange: (value: number) => void;
  max?: number;
  className?: string;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const limit = max ?? Infinity;

  function clamp(n: number) {
    return Math.min(limit, Math.max(1, n));
  }

  return (
    <input
      id={id}
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      value={draft ?? String(value)}
      onFocus={(e) => e.target.select()}
      onChange={(e) => {
        const text = e.target.value.replace(/\D/g, "");
        setDraft(text);
        const n = Number(text);
        if (text !== "" && n >= 1) onChange(clamp(n));
      }}
      onBlur={() => setDraft(null)}
      className={className}
    />
  );
}
