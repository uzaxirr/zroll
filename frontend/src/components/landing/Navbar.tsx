"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { WalletLogo } from "../WalletLogo";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Docs", href: "#" },
  { label: "About", href: "#" },
];

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 md:px-12 py-4"
        style={{
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          background: "rgba(5,5,5,0.8)",
          animation: "fadeIn 0.3s ease both",
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

        {/* Center: Nav Links (hidden on mobile) */}
        <div className="hidden md:flex items-center gap-8">
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

        {/* Right: Auth (hidden on mobile) */}
        <div className="hidden md:flex items-center gap-6">
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

        {/* Hamburger button (visible on mobile only) */}
        <button
          className="md:hidden flex items-center justify-center text-white p-2"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {/* Mobile full-screen overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-8 md:hidden"
            style={{ background: "rgba(5,5,5,0.97)" }}
          >
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-xl font-medium transition-colors duration-200 hover:text-white"
                style={{ color: "rgba(255,255,255,0.7)" }}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="flex flex-col items-center gap-4 mt-4">
              <Link
                href="/sign-in"
                className="text-lg transition-colors duration-200 hover:text-white"
                style={{ color: "rgba(255,255,255,0.6)" }}
                onClick={() => setMobileMenuOpen(false)}
              >
                Log in
              </Link>
              <Link
                href="/sign-up"
                className="text-base font-medium text-white px-8 py-3 rounded-full transition-colors duration-200 hover:opacity-90"
                style={{ backgroundColor: "#059669" }}
                onClick={() => setMobileMenuOpen(false)}
              >
                Get Started
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
