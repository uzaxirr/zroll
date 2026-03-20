"use client";

import Link from "next/link";
import { WalletLogo } from "./WalletLogo";

const columns = [
  {
    title: "PRODUCT",
    links: ["Payroll", "Tax Engine", "Portfolio", "Viewing Keys"],
  },
  {
    title: "COMPANY",
    links: ["About", "Blog", "Careers"],
  },
  {
    title: "RESOURCES",
    links: ["Docs", "API", "Privacy", "Terms"],
  },
];

export function Footer() {
  return (
    <footer
      className="w-full px-24 pt-14 pb-12"
      style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="max-w-[1240px] mx-auto flex justify-between">
        {/* Left: Logo + tagline */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2.5">
            <WalletLogo size={26} />
            <span
              className="text-white font-medium"
              style={{
                fontFamily: "'Inter', system-ui, sans-serif",
                fontSize: 16,
                letterSpacing: "-0.02em",
              }}
            >
              zwage
            </span>
          </div>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, lineHeight: "16px" }}>
            Private crypto payroll for modern teams.
          </p>
        </div>

        {/* Right: Link columns */}
        <div className="flex gap-20">
          {columns.map((col) => (
            <div key={col.title} className="flex flex-col gap-4">
              <span
                className="font-medium uppercase"
                style={{
                  fontSize: 11,
                  letterSpacing: "0.08em",
                  color: "rgba(255,255,255,0.35)",
                }}
              >
                {col.title}
              </span>
              {col.links.map((link) => (
                <Link
                  key={link}
                  href="#"
                  className="transition-colors duration-200 hover:text-white"
                  style={{
                    fontSize: 13,
                    color: "rgba(255,255,255,0.45)",
                    lineHeight: "16px",
                  }}
                >
                  {link}
                </Link>
              ))}
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}
