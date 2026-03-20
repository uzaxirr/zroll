"use client";

import { ScrollReveal } from "./ScrollReveal";
import { SectionLabel } from "./SectionLabel";

/* Chain logo icons */
function ZcashLogo() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7.5" fill="#F59E0B" />
      <rect x="4.5" y="3.5" width="7" height="1.5" rx="0.4" fill="#FFFFFF" />
      <polygon points="10,5 5.5,10.5 10,10.5" fill="#FFFFFF" />
      <rect x="4.5" y="11" width="7" height="1.5" rx="0.4" fill="#FFFFFF" />
    </svg>
  );
}

function SolanaLogo() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7.5" fill="#000000" />
      <path d="M4.2,10 L9.8,10 L11.5,11.7 L3,11.7 Z" fill="url(#sol1)" />
      <path d="M4.2,7 L9.8,7 L11.5,8.7 L3,8.7 Z" fill="url(#sol2)" />
      <path d="M9.8,5.7 L4.2,5.7 L3,4 L11.5,4 Z" fill="url(#sol3)" />
      <defs>
        <linearGradient id="sol1" x1="3" y1="8" x2="11.5" y2="8">
          <stop stopColor="#9945FF" />
          <stop offset="1" stopColor="#14F195" />
        </linearGradient>
        <linearGradient id="sol2" x1="3" y1="8" x2="11.5" y2="8">
          <stop stopColor="#9945FF" />
          <stop offset="1" stopColor="#14F195" />
        </linearGradient>
        <linearGradient id="sol3" x1="3" y1="8" x2="11.5" y2="8">
          <stop stopColor="#9945FF" />
          <stop offset="1" stopColor="#14F195" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function EthereumLogo() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7.5" fill="#627EEA" />
      <path d="M8,3 L5,8.5 L8,10 L11,8.5 Z" fill="#FFFFFF" opacity="0.9" />
      <path d="M5,9.2 L8,13 L11,9.2 L8,10.7 Z" fill="#FFFFFF" opacity="0.7" />
    </svg>
  );
}

function BaseLogo() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7.5" fill="#0052FF" />
      <circle cx="8" cy="8" r="4.5" fill="none" stroke="#FFFFFF" strokeWidth="1.3" />
      <path d="M7,6 L9.5,6 C10.5,6 11.2,6.7 11.2,7.5 C11.2,8.3 10.5,8.2 9.8,8.2 L7,8.2 Z" fill="#FFFFFF" />
      <path d="M7,8.2 L9.8,8.2 C10.7,8.2 11.4,8.8 11.4,9.6 C11.4,10.4 10.7,10.5 9.8,10.5 L7,10.5 Z" fill="#FFFFFF" />
    </svg>
  );
}

function ArbitrumLogo() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7.5" fill="#28A0F0" />
      <path d="M8,4 L4.5,12 L6.2,12 L8,7.5 L9.8,12 L11.5,12 Z" fill="#FFFFFF" />
      <path d="M6.8,10 L6,12 L7.2,12 L7.6,10.8 Z" fill="#FFFFFF" opacity="0.6" />
    </svg>
  );
}

const chainLogos: Record<string, React.ReactNode> = {
  Zcash: <ZcashLogo />,
  Solana: <SolanaLogo />,
  Ethereum: <EthereumLogo />,
  Base: <BaseLogo />,
  Arbitrum: <ArbitrumLogo />,
};

/* Chain pill with logo */
function ChainPill({ name }: { name: string }) {
  return (
    <div
      className="flex items-center gap-2 px-4 py-2 rounded-full"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {chainLogos[name]}
      <span className="text-white text-sm font-medium">{name}</span>
    </div>
  );
}

/* Mini transaction row */
function TxRow({
  label,
  amount,
  currency,
  status,
  statusColor,
}: {
  label: string;
  amount: string;
  currency: string;
  status: string;
  statusColor: string;
}) {
  return (
    <div
      className="flex items-center justify-between px-4 py-3 rounded-xl"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="flex flex-col gap-0.5">
        <span className="text-white text-sm font-medium">{label}</span>
        <span
          className="text-xs font-semibold uppercase"
          style={{ color: statusColor, letterSpacing: "0.05em" }}
        >
          {status}
        </span>
      </div>
      <div className="text-right">
        <span className="text-white font-bold text-sm font-tabular">
          {amount}
        </span>
        <span
          className="text-xs ml-1.5"
          style={{ color: "rgba(255,255,255,0.4)" }}
        >
          {currency}
        </span>
      </div>
    </div>
  );
}

/* Invoice card */
function InvoiceCard({
  title,
  amount,
  currency,
}: {
  title: string;
  amount: string;
  currency: string;
}) {
  return (
    <div
      className="flex items-center justify-between px-4 py-3 rounded-xl"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.06)" }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect
              x="2"
              y="1"
              width="10"
              height="12"
              rx="1.5"
              stroke="rgba(255,255,255,0.4)"
              strokeWidth="1.2"
            />
            <line
              x1="4.5"
              y1="4.5"
              x2="9.5"
              y2="4.5"
              stroke="rgba(255,255,255,0.3)"
              strokeWidth="1"
            />
            <line
              x1="4.5"
              y1="7"
              x2="8"
              y2="7"
              stroke="rgba(255,255,255,0.3)"
              strokeWidth="1"
            />
            <line
              x1="4.5"
              y1="9.5"
              x2="7"
              y2="9.5"
              stroke="rgba(255,255,255,0.3)"
              strokeWidth="1"
            />
          </svg>
        </div>
        <span className="text-white text-sm font-medium">{title}</span>
      </div>
      <span className="text-white font-bold text-sm font-tabular">
        {amount}{" "}
        <span style={{ color: "rgba(255,255,255,0.4)", fontWeight: 400 }}>
          {currency}
        </span>
      </span>
    </div>
  );
}

/* Ledger row for accounting card */
function LedgerRow({
  category,
  amount,
}: {
  category: string;
  amount: string;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <span
        className="text-sm"
        style={{ color: "rgba(255,255,255,0.55)" }}
      >
        {category}
      </span>
      <span className="text-white text-sm font-bold font-tabular">
        {amount}
      </span>
    </div>
  );
}

export function MoreThanPayments() {
  return (
    <section className="relative py-32 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <ScrollReveal>
          <div className="text-center mb-16">
            <SectionLabel>Platform</SectionLabel>
            <h2
              className="font-headline font-bold text-white mt-5"
              style={{
                fontSize: 44,
                letterSpacing: "-0.03em",
                lineHeight: "52px",
              }}
            >
              More than just payments
            </h2>
            <p
              className="mt-5 mx-auto max-w-lg"
              style={{
                fontSize: 16,
                lineHeight: "28px",
                color: "rgba(255,255,255,0.45)",
              }}
            >
              Manage invoices, track cost basis, and automate accounting —
              all from one privacy-first platform.
            </p>
          </div>
        </ScrollReveal>

        {/* Two cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Fund with ZEC */}
          <ScrollReveal delay={0.1}>
            <div
              className="rounded-2xl p-8 h-full card-hover"
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <h3
                className="font-headline font-bold text-white"
                style={{ fontSize: 26, letterSpacing: "-0.02em", lineHeight: "34px" }}
              >
                Fund with ZEC.
                <br />
                They choose their chain.
              </h3>
              <p
                className="mt-3 mb-8"
                style={{
                  fontSize: 14,
                  lineHeight: "24px",
                  color: "rgba(255,255,255,0.4)",
                }}
              >
                Deposit shielded ZEC — contributors receive on their
                preferred chain.
              </p>

              {/* Transaction mock */}
              <div className="space-y-3 mb-8">
                <TxRow
                  label="Deposit"
                  amount="2,450"
                  currency="ZEC"
                  status="Confirmed"
                  statusColor="#059669"
                />
                <TxRow
                  label="Payroll batch"
                  amount="23,400"
                  currency="USD equiv."
                  status="Completed"
                  statusColor="#059669"
                />
              </div>

              {/* Separator with arrow */}
              <div className="flex items-center gap-3 mb-6">
                <div
                  className="flex-1 h-px"
                  style={{ background: "rgba(255,255,255,0.06)" }}
                />
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                >
                  <path
                    d="M10 4L10 16M10 16L6 12M10 16L14 12"
                    stroke="rgba(255,255,255,0.25)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div
                  className="flex-1 h-px"
                  style={{ background: "rgba(255,255,255,0.06)" }}
                />
              </div>

              {/* Chain pills */}
              <div className="flex flex-wrap gap-2">
                <ChainPill name="Zcash" />
                <ChainPill name="Solana" />
                <ChainPill name="Ethereum" />
                <ChainPill name="Base" />
                <ChainPill name="Arbitrum" />
              </div>
            </div>
          </ScrollReveal>

          {/* Card 2: Invoices & Tax */}
          <ScrollReveal delay={0.2}>
            <div
              className="rounded-2xl p-8 h-full flex flex-col card-hover"
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <h3
                className="font-headline font-bold text-white"
                style={{ fontSize: 26, letterSpacing: "-0.02em", lineHeight: "34px" }}
              >
                Invoices & tax.
                <br />
                Built right in.
              </h3>
              <p
                className="mt-3 mb-8"
                style={{
                  fontSize: 14,
                  lineHeight: "24px",
                  color: "rgba(255,255,255,0.4)",
                }}
              >
                FIFO cost basis, Form 8949 export, and invoice tracking
                without extra tools.
              </p>

              {/* Invoices */}
              <div className="space-y-2.5 mb-6">
                <InvoiceCard
                  title="Argentina Dev Team"
                  amount="4,000"
                  currency="USDC"
                />
                <InvoiceCard
                  title="UK Design Contract"
                  amount="2,800"
                  currency="USDC"
                />
                <InvoiceCard
                  title="Nigeria Support Staff"
                  amount="1,500"
                  currency="USDC"
                />
              </div>

              {/* Accounting mini-ledger */}
              <div
                className="rounded-xl px-5 py-4 mt-auto"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-6 h-6 rounded flex items-center justify-center"
                    style={{ background: "#059669" }}
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path
                        d="M2 6H10M6 2V10"
                        stroke="white"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  <span
                    className="text-xs font-semibold uppercase"
                    style={{
                      color: "rgba(255,255,255,0.4)",
                      letterSpacing: "0.08em",
                    }}
                  >
                    Tax Summary — Q1 2026
                  </span>
                </div>
                <LedgerRow category="Total payroll" amount="$48,300" />
                <LedgerRow category="Cost basis (FIFO)" amount="$41,200" />
                <LedgerRow category="Realized gain" amount="$7,100" />
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
