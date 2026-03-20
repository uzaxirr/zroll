"use client";

const stats = [
  { value: "100%", label: "Shielded transactions" },
  { value: "5 chains", label: "ZEC, SOL, ETH, ARB, BASE" },
  { value: "AES-256", label: "End-to-end encrypted" },
  { value: "FIFO", label: "Built-in tax engine" },
];

export function TrustStrip() {
  return (
    <section className="py-20 px-6">
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
              <span
                className="font-headline font-bold text-white block"
                style={{ fontSize: 32, letterSpacing: "-0.02em" }}
              >
                {stat.value}
              </span>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
                {stat.label}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
