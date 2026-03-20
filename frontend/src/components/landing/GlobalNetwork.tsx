"use client";

import { ScrollReveal } from "./ScrollReveal";
import { WorldMapSVG } from "./WorldMapSVG";
import { WalletLogo } from "./WalletLogo";

/* Solana icon - three horizontal bars */
function SolanaIcon() {
  return (
    <svg width="14" height="12" viewBox="0 0 14 12" fill="none">
      <path d="M2.2,9.2 L10.5,9.2 L12.8,11.5 L0.5,11.5 Z" fill="#FFFFFF" />
      <path d="M2.2,4.8 L10.5,4.8 L12.8,7.1 L0.5,7.1 Z" fill="#FFFFFF" />
      <path d="M10.5,2.8 L2.2,2.8 L0.5,0.5 L12.8,0.5 Z" fill="#FFFFFF" />
    </svg>
  );
}

/* Ethereum icon - diamond */
function EthereumIcon() {
  return (
    <svg width="10" height="16" viewBox="0 0 10 16" fill="none">
      <path d="M5,0 L0,8 L5,10.8 L10,8 Z" fill="#FFFFFF" opacity="0.9" />
      <path d="M0,9 L5,16 L10,9 L5,11.8 Z" fill="#FFFFFF" opacity="0.6" />
    </svg>
  );
}

/* Zcash icon - Z with horizontal bars */
function ZcashIcon() {
  return (
    <svg width="12" height="14" viewBox="0 0 12 14" fill="none">
      <rect x="1" y="0.5" width="10" height="2" rx="0.5" fill="#000000" />
      <polygon points="9.5,2.5 3,11 9.5,11" fill="#000000" />
      <rect x="1" y="11.5" width="10" height="2" rx="0.5" fill="#000000" />
    </svg>
  );
}

/* Arbitrum icon - stylized A */
function ArbitrumIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M7,1 L1.5,12 L4,12 L7,5.5 L10,12 L12.5,12 Z" fill="#FFFFFF" />
      <path d="M5.5,9 L4.2,12 L6,12 L6.8,9.8 Z" fill="#FFFFFF" opacity="0.6" />
    </svg>
  );
}

/* Base icon - stylized B */
function BaseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="6" fill="none" stroke="#FFFFFF" strokeWidth="1.5" />
      <path d="M5,4 L8,4 C9.5,4 10.5,5 10.5,6 C10.5,7 9.5,7.5 8.5,7.5 L5,7.5 Z" fill="#FFFFFF" />
      <path d="M5,7.5 L8.5,7.5 C10,7.5 11,8.5 11,9.5 C11,10.5 10,11 8.5,11 L5,11 Z" fill="#FFFFFF" />
    </svg>
  );
}

const recipients = [
  {
    name: "Sarah K.",
    country: "United States",
    amount: "5,000 USDC",
    amountColor: "#14F195",
    borderColor: "#9945FF33",
    tokenBg: "linear-gradient(135deg, #9945FF, #14F195)",
    icon: <SolanaIcon />,
    style: { left: 20, top: 225 },
  },
  {
    name: "Marcus T.",
    country: "Germany",
    amount: "4,200 USDC",
    amountColor: "#627EEA",
    borderColor: "#627EEA33",
    tokenBg: "#627EEA",
    icon: <EthereumIcon />,
    style: { left: 1050, top: 200 },
  },
  {
    name: "Alex C.",
    country: "Argentina",
    amount: "8.5 ZEC shielded",
    amountColor: "#F59E0B",
    borderColor: "#F59E0B33",
    tokenBg: "#F59E0B",
    icon: <ZcashIcon />,
    style: { left: 60, top: 435 },
  },
  {
    name: "Thabo M.",
    country: "South Africa",
    amount: "3,500 USDC",
    amountColor: "#0052FF",
    borderColor: "#0052FF33",
    tokenBg: "#0052FF",
    icon: <BaseIcon />,
    style: { left: 460, top: 530 },
  },
  {
    name: "Ravi P.",
    country: "India",
    amount: "2,500 USDC",
    amountColor: "#28A0F0",
    borderColor: "#28A0F033",
    tokenBg: "#28A0F0",
    icon: <ArbitrumIcon />,
    style: { left: 1020, top: 435 },
  },
];

export function GlobalNetwork() {
  return (
    <section className="relative w-full overflow-hidden" style={{ height: 680 }}>
      <div className="relative max-w-[1440px] mx-auto h-full">
        {/* World map background */}
        <WorldMapSVG />

        {/* Flow arcs SVG */}
        <svg
          width="1440"
          height="700"
          viewBox="0 0 1440 700"
          className="absolute left-0 top-0"
          style={{ pointerEvents: "none" }}
        >
          {/* Dashed line from business card to hub */}
          <line x1="640" y1="100" x2="640" y2="165" stroke="rgba(255,255,255,0.15)" strokeDasharray="3,3" />

          {/* Arc to Sarah (top-left) */}
          <path
            d="M598,198 C470,128 300,155 170,252"
            fill="none"
            stroke="rgba(255,255,255,0.25)"
            strokeWidth="1.2"
            strokeDasharray="6,4"
            style={{ animation: "flowDash 1.5s linear infinite" }}
          />
          <circle cx="170" cy="252" r="3.5" fill="rgba(255,255,255,0.4)" />
          <path
            d="M380,155 L388,158 L380,161"
            fill="none"
            stroke="rgba(255,255,255,0.35)"
            strokeWidth="1.2"
            strokeLinecap="round"
            style={{ animation: "chevronPulse 2s ease-in-out infinite" }}
          />

          {/* Arc to Marcus (top-right) */}
          <path
            d="M682,198 C825,125 1000,148 1192,228"
            fill="none"
            stroke="rgba(255,255,255,0.25)"
            strokeWidth="1.2"
            strokeDasharray="6,4"
            style={{ animation: "flowDash 1.5s linear infinite 0.3s" }}
          />
          <circle cx="1192" cy="228" r="3.5" fill="rgba(255,255,255,0.4)" />
          <path
            d="M920,152 L928,155 L920,158"
            fill="none"
            stroke="rgba(255,255,255,0.35)"
            strokeWidth="1.2"
            strokeLinecap="round"
            style={{ animation: "chevronPulse 2s ease-in-out infinite 0.3s" }}
          />

          {/* Arc to Alex (bottom-left) */}
          <path
            d="M598,218 C435,338 300,405 215,462"
            fill="none"
            stroke="rgba(255,255,255,0.25)"
            strokeWidth="1.2"
            strokeDasharray="6,4"
            style={{ animation: "flowDash 1.5s linear infinite 0.6s" }}
          />
          <circle cx="215" cy="462" r="3.5" fill="rgba(255,255,255,0.4)" />
          <path
            d="M400,340 L408,343 L400,346"
            fill="none"
            stroke="rgba(255,255,255,0.35)"
            strokeWidth="1.2"
            strokeLinecap="round"
            style={{ animation: "chevronPulse 2s ease-in-out infinite 0.6s" }}
          />

          {/* Arc to Ravi (bottom-right) */}
          <path
            d="M682,218 C865,338 1000,408 1172,462"
            fill="none"
            stroke="rgba(255,255,255,0.25)"
            strokeWidth="1.2"
            strokeDasharray="6,4"
            style={{ animation: "flowDash 1.5s linear infinite 0.9s" }}
          />
          <circle cx="1172" cy="462" r="3.5" fill="rgba(255,255,255,0.4)" />
          <path
            d="M890,345 L898,348 L890,351"
            fill="none"
            stroke="rgba(255,255,255,0.35)"
            strokeWidth="1.2"
            strokeLinecap="round"
            style={{ animation: "chevronPulse 2s ease-in-out infinite 0.9s" }}
          />

          {/* Arc to Thabo (bottom-center) */}
          <path
            d="M640,232 C635,380 625,470 612,558"
            fill="none"
            stroke="rgba(255,255,255,0.25)"
            strokeWidth="1.2"
            strokeDasharray="6,4"
            style={{ animation: "flowDash 1.5s linear infinite 1.2s" }}
          />
          <circle cx="612" cy="558" r="3.5" fill="rgba(255,255,255,0.4)" />
          <path
            d="M633,395 L636,403 L629,403"
            fill="none"
            stroke="rgba(255,255,255,0.35)"
            strokeWidth="1.2"
            strokeLinecap="round"
            style={{ animation: "chevronPulse 2s ease-in-out infinite 1.2s" }}
          />
        </svg>

        {/* "Your Business" card */}
        <ScrollReveal delay={0}>
          <div
            className="absolute flex items-center gap-3 px-4 py-3"
            style={{
              left: 640,
              top: 30,
              transform: "translateX(-50%)",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(245,158,11,0.25)",
              borderRadius: 14,
            }}
          >
            <WalletLogo size={40} />
            <div className="flex flex-col">
              <span className="font-bold text-white" style={{ fontSize: 15 }}>
                Your Business
              </span>
              <div className="flex items-center gap-1.5">
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Send</span>
                <span className="font-bold" style={{ fontSize: 13, color: "#F59E0B" }}>
                  2,450 ZEC
                </span>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Center hub — positioned at arc convergence point (640, 210) */}
        <div
          className="absolute flex items-center justify-center"
          style={{
            left: 640,
            top: 210,
            transform: "translate(-50%, -50%)",
            width: 88,
            height: 88,
            borderRadius: 22,
            background: "rgba(5,5,5,0.85)",
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 0 30px rgba(245,158,11,0.08)",
          }}
        >
          <WalletLogo size={52} />
        </div>

        {/* Recipient cards - exact pixel positions */}
        {recipients.map((r, i) => (
          <ScrollReveal key={r.name} delay={0.1 + i * 0.15}>
            <div
              className="absolute flex items-center"
              style={{
                ...r.style,
                borderRadius: 100,
                background: "rgba(255,255,255,0.04)",
                border: `1px solid ${r.borderColor}`,
                paddingBlock: 12,
                paddingInline: 18,
                gap: 10,
              }}
            >
              {/* Token circle with chain icon */}
              <div
                className="flex items-center justify-center rounded-full shrink-0"
                style={{ width: 32, height: 32, background: r.tokenBg }}
              >
                {r.icon}
              </div>
              {/* Text */}
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-white" style={{ fontSize: 13 }}>
                    {r.name}
                  </span>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>from</span>
                  <span className="font-semibold text-white" style={{ fontSize: 12 }}>
                    {r.country}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>Received</span>
                  <span className="font-bold" style={{ fontSize: 12, color: r.amountColor }}>
                    {r.amount}
                  </span>
                </div>
              </div>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
