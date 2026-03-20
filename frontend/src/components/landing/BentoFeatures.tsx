"use client";

import { SectionLabel } from "./SectionLabel";

function FeatureIcon({ type }: { type: "shield" | "eye" | "lock" | "calc" }) {
  const icons: Record<string, JSX.Element> = {
    shield: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    eye: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
    lock: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
    calc: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#627EEA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="2" width="16" height="20" rx="2" />
        <line x1="8" y1="6" x2="16" y2="6" />
        <line x1="8" y1="14" x2="8" y2="14" />
        <line x1="12" y1="14" x2="12" y2="14" />
        <line x1="16" y1="14" x2="16" y2="14" />
        <line x1="8" y1="18" x2="8" y2="18" />
        <line x1="12" y1="18" x2="12" y2="18" />
        <line x1="16" y1="18" x2="16" y2="18" />
      </svg>
    ),
  };
  return (
    <div
      className="flex items-center justify-center rounded-lg shrink-0"
      style={{
        width: 40,
        height: 40,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {icons[type]}
    </div>
  );
}

function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl p-7 card-hover ${className}`}
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {children}
    </div>
  );
}

export function BentoFeatures() {
  return (
    <section id="features" className="pt-8 pb-24 px-6">
      <div className="max-w-[1240px] mx-auto">
        {/* Header */}
        <div className="flex flex-col items-center gap-4 mb-14">
          <SectionLabel>Features</SectionLabel>
          <h2
            className="font-headline font-bold text-white text-center"
            style={{ fontSize: 48, letterSpacing: "-0.03em", lineHeight: "56px" }}
          >
            Everything your payroll needs
          </h2>
        </div>

        {/* Bento grid */}
        <div className="flex flex-col lg:flex-row gap-5" style={{ maxWidth: 1100, margin: "0 auto" }}>
          {/* Left column */}
          <div className="flex flex-col gap-3 lg:w-[592px]">
            <GlassCard>
              <FeatureIcon type="shield" />
              <h3 className="font-headline font-bold text-white text-xl mt-5 mb-3">
                Shielded Payroll
              </h3>
              <p style={{ fontSize: 15, lineHeight: "24px", color: "rgba(255,255,255,0.5)" }}>
                Every payment uses Zcash&apos;s Orchard pool. Amounts, recipients, and timing are
                invisible on the public blockchain.
              </p>
              {/* Mini table */}
              <div
                className="mt-6 rounded-xl overflow-hidden"
                style={{
                  border: "1px solid rgba(255,255,255,0.06)",
                  background: "rgba(255,255,255,0.02)",
                }}
              >
                {[
                  { field: "Sender", status: "shielded" },
                  { field: "Amount", status: "shielded" },
                  { field: "Memo", status: "encrypted" },
                ].map((row, i) => (
                  <div
                    key={row.field}
                    className="flex items-center justify-between px-5 py-3"
                    style={{
                      borderTop: i > 0 ? "1px solid rgba(255,255,255,0.04)" : undefined,
                    }}
                  >
                    <span style={{ fontSize: 14, color: "rgba(255,255,255,0.4)" }}>
                      {row.field}
                    </span>
                    <span style={{ fontSize: 13, color: "#10B981", fontWeight: 500 }}>
                      {row.status}
                    </span>
                  </div>
                ))}
              </div>
            </GlassCard>

            <GlassCard>
              <FeatureIcon type="calc" />
              <h3 className="font-headline font-bold text-white text-xl mt-5 mb-3">
                Tax Engine
              </h3>
              <p style={{ fontSize: 15, lineHeight: "24px", color: "rgba(255,255,255,0.5)" }}>
                FIFO cost basis, automatic gain/loss, Form 8949 CSV export. Short-term and
                long-term holding periods.
              </p>
            </GlassCard>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-3 lg:w-[494px]">
            <GlassCard>
              <FeatureIcon type="lock" />
              <h3 className="font-headline font-bold text-white text-xl mt-5 mb-3">
                Zero Storage
              </h3>
              <p style={{ fontSize: 15, lineHeight: "24px", color: "rgba(255,255,255,0.5)" }}>
                We don&apos;t store transactions. Everything is read from the
                blockchain via your viewing key. Nothing to breach.
              </p>
            </GlassCard>

            <GlassCard>
              <FeatureIcon type="eye" />
              <h3 className="font-headline font-bold text-white text-xl mt-5 mb-3">
                Selective Disclosure
              </h3>
              <p style={{ fontSize: 15, lineHeight: "24px", color: "rgba(255,255,255,0.5)" }}>
                Private by default. Auditable on demand. Share time-limited
                viewing keys with auditors. Revoke anytime.
              </p>
              {/* Viewer roles */}
              <div className="flex flex-col mt-5 gap-0">
                {[
                  { role: "IRS Auditor", status: "Active", dotColor: "#10B981", statusColor: "#10B981" },
                  { role: "Accountant", status: "Active", dotColor: "#10B981", statusColor: "#10B981" },
                  { role: "Board Observer", status: "Revoked", dotColor: "#DC2626", statusColor: "#DC2626" },
                ].map((viewer, i) => (
                  <div
                    key={viewer.role}
                    className="flex items-center justify-between px-4 py-3"
                    style={{
                      borderTop: i > 0 ? "1px solid rgba(255,255,255,0.04)" : undefined,
                      background: "rgba(255,255,255,0.02)",
                      borderRadius: i === 0 ? "10px 10px 0 0" : i === 2 ? "0 0 10px 10px" : 0,
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="rounded-full shrink-0"
                        style={{ width: 6, height: 6, backgroundColor: viewer.dotColor }}
                      />
                      <span style={{ fontSize: 14, color: "rgba(255,255,255,0.7)" }}>
                        {viewer.role}
                      </span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 500, color: viewer.statusColor }}>
                      {viewer.status}
                    </span>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </section>
  );
}
