export function Logo({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      width="48"
      height="48"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* MIP Monogram with Eastern pattern */}
      <circle cx="24" cy="24" r="22" stroke="#d11c5e" strokeWidth="1.5" />

      {/* Dress silhouette in center */}
      <path
        d="M24 8 L28 14 L28 28 C28 30 26.5 32 24 32 C21.5 32 20 30 20 28 L20 14 L24 8 Z"
        fill="#d11c5e"
      />

      {/* Decorative pattern - Eastern motif */}
      <circle cx="24" cy="12" r="1.5" fill="#d11c5e" opacity="0.6" />
      <circle cx="21" cy="18" r="1" fill="#d11c5e" opacity="0.6" />
      <circle cx="27" cy="18" r="1" fill="#d11c5e" opacity="0.6" />
      <circle cx="20" cy="24" r="1" fill="#d11c5e" opacity="0.6" />
      <circle cx="28" cy="24" r="1" fill="#d11c5e" opacity="0.6" />

      {/* Decorative corners */}
      <path
        d="M10 10 L12 10 M10 10 L10 12"
        stroke="#d11c5e"
        strokeWidth="1"
        opacity="0.5"
      />
      <path
        d="M38 10 L36 10 M38 10 L38 12"
        stroke="#d11c5e"
        strokeWidth="1"
        opacity="0.5"
      />
      <path
        d="M10 38 L12 38 M10 38 L10 36"
        stroke="#d11c5e"
        strokeWidth="1"
        opacity="0.5"
      />
      <path
        d="M38 38 L36 38 M38 38 L38 36"
        stroke="#d11c5e"
        strokeWidth="1"
        opacity="0.5"
      />
    </svg>
  );
}

export function LogoWithText({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Logo className="w-10 h-10" />
      <span className="font-bold text-lg text-gray-900">MIP</span>
    </div>
  );
}
