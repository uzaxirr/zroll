"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { WalletLogo } from "../WalletLogo";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Docs", href: "#" },
  { label: "About", href: "#" },
];

export function Navbar() {
  return (
    <motion.nav
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-12 py-4"
      style={{
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        background: "rgba(5,5,5,0.8)",
      }}
    >
      {/* Left: Logo */}
      <div className="flex items-center gap-2.5">
        <WalletLogo size={32} />
        <span
          className="text-white text-xl font-medium"
          style={{
            fontFamily: "'Inter', system-ui, sans-serif",
            letterSpacing: "-0.02em",
          }}
        >
          zwage
        </span>
      </div>

      {/* Center: Nav Links */}
      <div className="flex items-center gap-8">
        {navLinks.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            className="text-sm transition-colors duration-200 hover:text-white"
            style={{ color: "rgba(255,255,255,0.6)" }}
          >
            {link.label}
          </Link>
        ))}
      </div>

      {/* Right: Auth */}
      <div className="flex items-center gap-6">
        <Link
          href="/sign-in"
          className="text-sm transition-colors duration-200 hover:text-white"
          style={{ color: "rgba(255,255,255,0.6)" }}
        >
          Log in
        </Link>
        <Link
          href="/sign-up"
          className="text-sm font-medium text-white px-5 py-2 rounded-full transition-colors duration-200 hover:opacity-90"
          style={{ backgroundColor: "#059669" }}
        >
          Get Started
        </Link>
      </div>
    </motion.nav>
  );
}
