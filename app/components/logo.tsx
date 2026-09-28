export function Logo({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 280 100"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* MIP Text - Modern Wordmark */}
      <text
        x="10"
        y="70"
        fontSize="72"
        fontWeight="700"
        fontFamily="Arial, sans-serif"
        fill="#d11c5e"
        letterSpacing="0"
      >
        MIP
      </text>

      {/* Underline */}
      <line x1="10" y1="78" x2="180" y2="78" stroke="#d11c5e" strokeWidth="2" />

      {/* Tagline */}
      <text
        x="10"
        y="98"
        fontSize="10"
        fontWeight="600"
        fontFamily="Arial, sans-serif"
        fill="#666666"
        letterSpacing="1.5"
      >
        MARKET IN PAKISTAN
      </text>
    </svg>
  );
}

export function LogoWithText({ className = "" }: { className?: string }) {
  return (
    <div className={className}>
      <Logo className="w-32 h-auto md:w-40" />
    </div>
  );
}
