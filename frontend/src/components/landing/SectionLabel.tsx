"use client";

export function SectionLabel({ children }: { children: string }) {
  return (
    <span
      className="text-xs font-medium uppercase tracking-[0.1em] block"
      style={{ color: "#10B981", fontSize: 12 }}
    >
      {children}
    </span>
  );
}
