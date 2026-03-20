"use client";

import { ScrollReveal } from "./ScrollReveal";

export function SignWithZodl() {
  return (
    <section className="pt-24 pb-16 px-6">
      <div className="max-w-[1100px] mx-auto flex items-center gap-20">
        {/* Left: Text */}
        <ScrollReveal direction="left" className="flex-1">
          <div style={{ maxWidth: 520 }}>
            <span
              className="font-medium uppercase block mb-4"
              style={{
                fontSize: 12,
                letterSpacing: "0.1em",
                color: "#F59E0B",
              }}
            >
              ZODL INTEGRATION
            </span>
            <h2
              className="font-headline font-bold text-white mb-5"
              style={{ fontSize: 48, letterSpacing: "-0.03em", lineHeight: "56px" }}
            >
              One scan.{"\n"}Batch approved.
            </h2>
            <p
              className="mb-6"
              style={{ fontSize: 17, lineHeight: "28px", color: "rgba(255,255,255,0.55)" }}
            >
              Zwage generates a ZIP-321 multi-payment URI. Open Zodl,
              approve once — all 24 payments execute in a single shielded
              transaction. Your keys never leave your wallet.
            </p>
            <div className="flex items-center gap-6">
              {["Self-custodial", "Batched payments", "Non-custodial"].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <div
                    className="rounded-full shrink-0"
                    style={{ width: 6, height: 6, backgroundColor: "#10B981" }}
                  />
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* Right: Zodl Wallet Card */}
        <ScrollReveal direction="right">
          <div
            className="flex flex-col overflow-hidden shrink-0"
            style={{
              width: 380,
              borderRadius: 35,
              backgroundColor: "#151314",
              border: "1px solid rgba(80,24,219,0.25)",
            }}
          >
            {/* Status bar */}
            <div className="flex items-center justify-between pt-4 px-7">
              <span
                style={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.4)",
                  fontFamily: "'Anek Latin', system-ui, sans-serif",
                  fontWeight: 500,
                }}
              >
                9:41
              </span>
              <div className="flex items-center gap-1.5">
                <div
                  className="relative shrink-0"
                  style={{
                    width: 16,
                    height: 10,
                    borderRadius: 2,
                    border: "1.5px solid rgba(255,255,255,0.4)",
                  }}
                >
                  <div
                    className="absolute"
                    style={{
                      top: 2,
                      left: 2,
                      width: 8,
                      height: 4,
                      borderRadius: 1,
                      backgroundColor: "rgba(255,255,255,0.4)",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Zodl heading */}
            <div className="flex items-center justify-center pt-5 pb-4 px-7">
              <span
                className="text-white"
                style={{
                  fontFamily: "'Michroma', system-ui, sans-serif",
                  fontSize: 18,
                  lineHeight: "22px",
                  letterSpacing: "0.05em",
                }}
              >
                Zodl
              </span>
            </div>

            {/* Transaction Request pill */}
            <div className="flex justify-center pb-5 px-7">
              <div
                className="flex items-center rounded-full py-1.5 px-4 gap-1.5"
                style={{ backgroundColor: "rgba(80,24,219,0.15)" }}
              >
                <div
                  className="rounded-full shrink-0"
                  style={{ width: 6, height: 6, backgroundColor: "#5018DB" }}
                />
                <span
                  style={{
                    fontSize: 12,
                    color: "#8B6AE0",
                    fontFamily: "'Anek Latin', system-ui, sans-serif",
                    fontWeight: 500,
                  }}
                >
                  Transaction Request
                </span>
              </div>
            </div>

            {/* Amount */}
            <div className="flex flex-col items-center pt-2 pb-6 gap-1 px-7">
              <span
                className="text-white"
                style={{
                  fontFamily: "'Michroma', system-ui, sans-serif",
                  fontSize: 36,
                  lineHeight: "44px",
                  letterSpacing: "-0.01em",
                }}
              >
                2,450
              </span>
              <span
                style={{
                  fontSize: 14,
                  color: "rgba(255,255,255,0.4)",
                  fontFamily: "'Anek Latin', system-ui, sans-serif",
                  fontWeight: 500,
                }}
              >
                ZEC
              </span>
            </div>

            {/* Detail rows */}
            <div className="flex flex-col pb-6 px-7">
              {[
                { label: "Recipients", value: "24 contributors", color: "rgba(255,255,255,0.75)" },
                { label: "Pool", value: "Orchard (shielded)", color: "#61CE70" },
                { label: "Network fee", value: "0.0001 ZEC", color: "rgba(255,255,255,0.75)" },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex justify-between py-3.5"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      color: "rgba(255,255,255,0.35)",
                      fontFamily: "'Anek Latin', system-ui, sans-serif",
                    }}
                  >
                    {row.label}
                  </span>
                  <span
                    style={{
                      fontSize: 13,
                      color: row.color,
                      fontFamily: "'Anek Latin', system-ui, sans-serif",
                      fontWeight: 500,
                    }}
                  >
                    {row.value}
                  </span>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <div className="pb-7 px-7">
              <div
                className="flex items-center justify-center rounded-full p-4"
                style={{ backgroundColor: "#61CE70" }}
              >
                <span
                  style={{
                    fontSize: 15,
                    color: "#0E0E0E",
                    fontFamily: "'Anek Latin', system-ui, sans-serif",
                    fontWeight: 600,
                  }}
                >
                  Approve &amp; Send
                </span>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
