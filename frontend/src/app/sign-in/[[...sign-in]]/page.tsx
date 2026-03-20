"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { WalletLogo } from "@/components/WalletLogo";
import { useAuth } from "@/lib/auth-context";

export default function SignInPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
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
          Welcome back
        </h2>
        <p className="text-gray-400 text-sm mt-4 leading-relaxed">
          Sign in to manage your shielded payroll.
        </p>
      </div>

      {/* Right Panel - Custom form */}
      <div className="flex-1 flex items-center justify-center bg-bg">
        <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6 p-8">
          <h1 className="text-2xl font-headline font-bold text-primary">Sign in</h1>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-secondary">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-card border border-card-border rounded-lg text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-green/50 focus:border-green"
              placeholder="you@company.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-secondary">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-card border border-card-border rounded-lg text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-green/50 focus:border-green"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-green hover:bg-green/90 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>

          <p className="text-center text-sm text-secondary">
            Don&apos;t have an account?{" "}
            <a href="/sign-up" className="text-green hover:underline">Sign up</a>
          </p>
        </form>
      </div>
    </div>
  );
}
