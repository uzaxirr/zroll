"use client";

import { useEffect, useRef, useState } from "react";
import { ScrollReveal } from "./ScrollReveal";

const stats = [
  { value: "100%", label: "Shielded transactions" },
  { value: "5 chains", label: "ZEC, SOL, ETH, ARB, BASE" },
  { value: "AES-256", label: "End-to-end encrypted" },
  { value: "FIFO", label: "Built-in tax engine" },
];

function CountUpValue({ value, inView }: { value: string; inView: boolean }) {
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    if (!inView) return;
    if (value === "100%") {
      let current = 0;
      const interval = setInterval(() => {
        current += 4;
        if (current >= 100) {
          current = 100;
          clearInterval(interval);
        }
        setDisplay(`${current}%`);
      }, 30);
      return () => clearInterval(interval);
    }
    setDisplay(value);
  }, [inView, value]);

  return (
    <span
      className="font-headline font-bold text-white block"
      style={{ fontSize: 32, letterSpacing: "-0.02em" }}
    >
      {display}
    </span>
  );
}

export function TrustStrip() {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className="py-20 px-6">
      <ScrollReveal>
        <div className="max-w-[936px] mx-auto flex items-center justify-between">
          {stats.map((stat, i) => (
            <div key={stat.label} className="flex items-center">
              {i > 0 && (
                <div
                  className="mr-16"
                  style={{
                    width: 1,
                    height: 40,
                    background: "rgba(255,255,255,0.08)",
                  }}
                />
              )}
              <div className="flex flex-col items-center gap-1.5">
                <CountUpValue value={stat.value} inView={inView} />
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
                  {stat.label}
                </span>
              </div>
            </div>
          ))}
        </div>
      </ScrollReveal>
    </section>
  );
}
