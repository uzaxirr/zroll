"use client";

import { SignUp } from "@clerk/nextjs";
import { Shield, FileText, Eye } from "lucide-react";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="w-[480px] bg-sidebar-dark flex flex-col justify-center px-14 py-12">
        <div className="flex items-center gap-2.5 mb-12">
          <div className="w-8 h-8 rounded-full bg-green flex items-center justify-center">
            <span className="text-white font-headline font-bold text-sm">Z</span>
          </div>
          <span className="text-white font-headline font-bold text-lg">zroll</span>
        </div>

        <h2 className="text-3xl font-headline font-bold text-white tracking-tight leading-tight">
          Privacy-first payroll
          <br />for your team
        </h2>
        <p className="text-gray-400 text-sm mt-4 leading-relaxed">
          Run payroll on Zcash. Shielded payments with on-chain pay stubs.
        </p>

        <div className="mt-10 space-y-5">
          {[
            { icon: Shield, text: "Every payment is fully shielded" },
            { icon: FileText, text: "Pay stubs encoded in Zcash memos" },
            { icon: Eye, text: "Selective disclosure for compliance" },
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
