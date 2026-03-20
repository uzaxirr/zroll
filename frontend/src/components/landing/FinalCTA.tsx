"use client";

import Link from "next/link";
import { ScrollReveal } from "./ScrollReveal";

export function FinalCTA() {
  return (
    <section className="relative pt-[100px] pb-[120px] px-6 overflow-hidden">
      {/* Aurora glow - stronger for premium feel */}
      <div
        className="absolute pointer-events-none left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: 800,
          height: 500,
          background: "radial-gradient(ellipse, rgba(5,150,105,0.18) 0%, rgba(245,158,11,0.1) 40%, transparent 70%)",
          animation: "auroraPulse 8s ease-in-out infinite",
        }}
      />
      <div
        className="absolute pointer-events-none left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: 500,
          height: 350,
          background: "radial-gradient(ellipse, rgba(245,158,11,0.12), transparent 70%)",
          animation: "auroraPulse 8s ease-in-out infinite 3s",
        }}
      />

      <ScrollReveal>
        <div className="relative z-10 flex flex-col items-center text-center">
          <h2
            className="font-headline font-bold text-white max-w-[600px]"
            style={{ fontSize: 48, letterSpacing: "-0.03em", lineHeight: "62px" }}
          >
            Start running private payroll in minutes
          </h2>
          <p
            className="mt-6 max-w-[460px]"
            style={{ fontSize: 16, lineHeight: "28px", color: "rgba(255,255,255,0.45)" }}
          >
            Non-custodial. Cross-chain. Compliant. Your keys,
            your wallet, your payroll.
          </p>
          <div className="flex items-center gap-5 mt-10">
            <Link
              href="/sign-up"
              className="flex items-center justify-center font-semibold text-white rounded-[12px] transition-colors duration-200 hover:opacity-90"
              style={{
                backgroundColor: "#059669",
                width: 148,
                height: 52,
                fontSize: 15,
              }}
            >
              Start Free
            </Link>
            <Link
              href="#"
              className="flex items-center justify-center font-medium text-white rounded-[12px] transition-colors duration-200 hover:bg-white/5"
              style={{
                border: "1px solid rgba(255,255,255,0.15)",
                width: 170,
                height: 54,
                fontSize: 15,
              }}
            >
              Talk to Sales
            </Link>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}
