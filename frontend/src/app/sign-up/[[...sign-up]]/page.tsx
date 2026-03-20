"use client";

import { SignUp } from "@clerk/nextjs";
import { Shield, FileText, Eye } from "lucide-react";
import { WalletLogo } from "@/components/WalletLogo";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="w-[480px] bg-sidebar-dark flex flex-col justify-center px-14 py-12">
        <div className="flex items-center gap-2.5 mb-12">
          <WalletLogo size={32} />
          <span
            className="text-white text-lg"
            style={{
              fontFamily: "'Inter', system-ui, sans-serif",
              fontWeight: 500,
              letterSpacing: "-0.02em",
            }}
          >
            zwage
          </span>
        </div>

        <h2 className="text-3xl font-headline font-bold text-white tracking-tight leading-tight">
          Payroll that stays between
          <br />you and your team.
        </h2>
        <p className="text-gray-400 text-sm mt-4 leading-relaxed">
          Shielded payroll, portfolio tracking, and tax reporting. Built on Zcash privacy technology.
        </p>

        <div className="mt-10 space-y-5">
          {[
            { icon: Shield, text: "Shielded transactions via Zcash Orchard pool" },
            { icon: FileText, text: "Automated tax reporting with FIFO cost basis" },
            { icon: Eye, text: "Selective disclosure with viewing keys" },
          ].map((item) => (
            <div key={item.text} className="flex items-center gap-3">
              <item.icon className="w-4 h-4 text-green flex-shrink-0" />
              <span className="text-sm text-gray-300">{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center bg-bg">
        <SignUp
          forceRedirectUrl="/dashboard"
          appearance={{
            elements: {
              rootBox: "w-full max-w-md",
              card: "shadow-none border border-card-border rounded-card",
              headerTitle: "font-headline font-bold",
              formButtonPrimary: "bg-green hover:bg-green/90",
            },
          }}
        />
      </div>
    </div>
  );
}
