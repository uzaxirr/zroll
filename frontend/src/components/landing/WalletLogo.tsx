"use client";

export function WalletLogo({ size = 32 }: { size?: number }) {
  const svgSize = Math.round(size * 0.6875);
  const radius = size <= 32 ? 8 : size <= 64 ? 16 : 22;

  return (
    <div
      className="flex items-center justify-center shrink-0"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor: "#111111",
      }}
    >
      <svg
        width={svgSize}
        height={svgSize}
        viewBox="0 0 76 76"
        fill="none"
      >
        <rect x="12" y="6" width="20" height="28" rx="4" fill="#9945FF" opacity={0.85} />
        <rect x="28" y="9" width="20" height="25" rx="4" fill="#627EEA" opacity={0.85} />
        <rect x="44" y="12" width="20" height="22" rx="4" fill="#F59E0B" opacity={0.85} />
        <rect x="6" y="26" width="64" height="44" rx="8" fill="#B45309" />
        <path d="M6 32 C6 28.7 8.7 26 12 26 L64 26 C67.3 26 70 28.7 70 32 L70 42 L6 42 Z" fill="#F59E0B" />
        <rect x="6" y="42" width="64" height="12" fill="#D97706" />
        <path d="M6 54 L70 54 L70 64 C70 67.3 67.3 70 64 70 L12 70 C8.7 70 6 67.3 6 64 Z" fill="#92400E" />
        {size >= 48 && (
          <>
            <circle cx="38" cy="42" r="5" fill="#F59E0B" />
            <circle cx="38" cy="42" r="2.5" fill="#D97706" />
          </>
        )}
      </svg>
    </div>
  );
}
