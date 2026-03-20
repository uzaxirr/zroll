"use client";

import { SectionLabel } from "./SectionLabel";

const scheduleRows = [
  { dot: "#10B981", date: "Mar 1", amount: "2,450 ZEC", badge: "PAID", badgeColor: "#10B981", badgeBg: "rgba(16,185,129,0.15)" },
  { dot: "#10B981", date: "Mar 15", amount: "2,450 ZEC", badge: "PAID", badgeColor: "#10B981", badgeBg: "rgba(16,185,129,0.15)" },
  { dot: "#F59E0B", date: "Apr 1", amount: "2,450 ZEC", badge: "UPCOMING", badgeColor: "#F59E0B", badgeBg: "rgba(245,158,11,0.15)" },
  { dot: "rgba(255,255,255,0.3)", date: "Apr 15", amount: "2,450 ZEC", badge: "SCHEDULED", badgeColor: "rgba(255,255,255,0.4)", badgeBg: "rgba(255,255,255,0.06)" },
];

export function AutopilotPayroll() {
  return (
    <section className="pt-16 pb-24 px-6">
      <div className="max-w-[1240px] mx-auto">
        {/* Header */}
        <div className="flex flex-col items-center gap-4 mb-6">
          <SectionLabel>Autopilot</SectionLabel>
          <h2
            className="font-headline font-bold text-white text-center"
            style={{ fontSize: 44, letterSpacing: "-0.03em", lineHeight: "52px" }}
          >
            Set a schedule.{"\n"}We handle the rest.
          </h2>
          <p
            className="text-center max-w-[520px]"
            style={{ fontSize: 16, lineHeight: "28px", color: "rgba(255,255,255,0.45)" }}
          >
            Configure once. Every pay cycle, you get notified. Preview,
            approve, done.
          </p>
        </div>

        {/* Two-column cards */}
        <div className="flex gap-5 mt-12" style={{ maxWidth: 1240, margin: "48px auto 0" }}>
          {/* Left: Payout Schedule */}
          <div className="flex-1">
            <div
              className="rounded-2xl p-7 h-[360px]"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <span
                className="font-medium uppercase block mb-6"
                style={{ fontSize: 11, letterSpacing: "0.08em", color: "rgba(255,255,255,0.4)" }}
              >
                PAYOUT SCHEDULE
              </span>
              <div className="flex flex-col gap-0">
                {scheduleRows.map((row, i) => (
                  <div
                    key={row.date}
                    className="flex items-center py-3"
                    style={{
                      borderTop: i > 0 ? "1px solid rgba(255,255,255,0.04)" : undefined,
                    }}
                  >
                    <div
                      className="rounded-full shrink-0"
                      style={{ width: 8, height: 8, backgroundColor: row.dot }}
                    />
                    <div
                      className="flex-1 mx-4"
                      style={{ height: 1, background: "rgba(255,255,255,0.06)" }}
                    />
                    <span
                      className="shrink-0 mr-6"
                      style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", width: 50 }}
                    >
                      {row.date}
                    </span>
                    <span
                      className="font-mono shrink-0 mr-4"
                      style={{
                        fontSize: 14,
                        color: row.badge === "PAID" ? "#10B981" : "rgba(255,255,255,0.6)",
                        fontVariantNumeric: "tabular-nums",
                        width: 90,
                      }}
                    >
                      {row.amount}
                    </span>
                    <span
                      className="rounded-full px-2.5 py-0.5 text-xs font-medium shrink-0"
                      style={{
                        color: row.badgeColor,
                        background: row.badgeBg,
                        fontSize: 10,
                        letterSpacing: "0.04em",
                      }}
                    >
                      {row.badge}
                    </span>
                  </div>
                ))}
              </div>
              <p
                className="mt-6"
                style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}
              >
                Bi-weekly cycle · 24 contributors
              </p>
            </div>
          </div>

          {/* Right: Notification + description */}
          <div className="flex-1">
            <div className="flex flex-col gap-5">
              {/* Notification card */}
              <div
                className="rounded-2xl p-6"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                {/* Notification header */}
                <div className="flex items-start gap-3 mb-4">
                  <div
                    className="flex items-center justify-center rounded-lg shrink-0 mt-0.5"
                    style={{
                      width: 36,
                      height: 36,
                      background: "rgba(245,158,11,0.1)",
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-white" style={{ fontSize: 15 }}>
                      Payroll batch ready
                    </h4>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
                      2 minutes ago
                    </span>
                  </div>
                </div>
                <p
                  className="mb-5"
                  style={{ fontSize: 14, lineHeight: "22px", color: "rgba(255,255,255,0.55)" }}
                >
                  24 contributors · 2,450 ZEC · $170,284 USD. Review and approve
                  when ready.
                </p>
                <div className="flex gap-3">
                  <button
                    className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors hover:opacity-90"
                    style={{ backgroundColor: "#059669" }}
                  >
                    Review Batch
                  </button>
                  <button
                    className="px-5 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-white/5"
                    style={{
                      color: "rgba(255,255,255,0.6)",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                  >
                    Dismiss
                  </button>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3
                  className="font-headline font-bold text-white mb-3"
                  style={{ fontSize: 22, letterSpacing: "-0.02em" }}
                >
                  Never miss a pay cycle
                </h3>
                <p style={{ fontSize: 15, lineHeight: "24px", color: "rgba(255,255,255,0.45)" }}>
                  Set bi-weekly, monthly, or custom schedules. When it&apos;s time, you get a
                  notification with the full batch summary. One click to review, one scan to
                  approve.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
