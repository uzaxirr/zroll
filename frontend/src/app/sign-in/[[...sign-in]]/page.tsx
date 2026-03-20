"use client";

import { SignIn } from "@clerk/nextjs";
import { WalletLogo } from "@/components/WalletLogo";

export default function SignInPage() {
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
          Welcome back
        </h2>
        <p className="text-gray-400 text-sm mt-4 leading-relaxed">
          Sign in to manage your shielded payroll.
        </p>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center bg-bg">
        <SignIn
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
