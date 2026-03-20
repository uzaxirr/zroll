"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, FileText, Eye } from "lucide-react";
import { WalletLogo } from "@/components/WalletLogo";
import { useAuth } from "@/lib/auth-context";

export default function SignUpPage() {
  const router = useRouter();
  const { signup } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signup(name, email, password, companyName);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - KEEP EXACTLY AS IS */}
      <div className="w-[480px] bg-sidebar-dark flex flex-col justify-center px-14 py-12">
        <div className="flex items-center gap-2.5 mb-12">
          <WalletLogo size={32} />
          <span className="text-white text-lg" style={{ fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 500, letterSpacing: "-0.02em" }}>
            zwage
          </span>
        </div>
        <h2 className="text-3xl font-headline font-bold text-white tracking-tight leading-tight">
          Payroll that stays between
          <br />
          you and your team.
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

      {/* Right Panel - Custom form */}
      <div className="flex-1 flex items-center justify-center bg-bg">
        <form onSubmit={handleSubmit} className="w-full max-w-md space-y-5 p-8">
          <h1 className="text-2xl font-headline font-bold text-primary">Create account</h1>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-secondary">Full name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
              className="w-full px-4 py-3 bg-card border border-card-border rounded-lg text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-green/50 focus:border-green"
              placeholder="Jane Smith" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-secondary">Work email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="w-full px-4 py-3 bg-card border border-card-border rounded-lg text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-green/50 focus:border-green"
              placeholder="jane@company.com" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-secondary">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8}
              className="w-full px-4 py-3 bg-card border border-card-border rounded-lg text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-green/50 focus:border-green"
              placeholder="Min. 8 characters" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-secondary">Company name</label>
            <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required
              className="w-full px-4 py-3 bg-card border border-card-border rounded-lg text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-green/50 focus:border-green"
              placeholder="Acme Corp" />
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3 bg-green hover:bg-green/90 text-white font-medium rounded-lg transition-colors disabled:opacity-50">
            {loading ? "Creating account..." : "Create account"}
          </button>

          <p className="text-center text-sm text-secondary">
            Already have an account?{" "}
            <a href="/sign-in" className="text-green hover:underline">Sign in</a>
          </p>
        </form>
      </div>
    </div>
  );
}
