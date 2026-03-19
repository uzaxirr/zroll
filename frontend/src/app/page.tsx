import { redirect } from "next/navigation";
import Link from "next/link";
import { Shield, Eye, FileText, Zap, Lock } from "lucide-react";

const BYPASS_AUTH = process.env.NEXT_PUBLIC_BYPASS_AUTH === "true";

export default async function LandingPage() {
  if (!BYPASS_AUTH) {
    const { auth } = await import("@clerk/nextjs/server");
    const { userId } = await auth();
    if (userId) {
      redirect("/dashboard");
    }
  }
  return (
    <div className="min-h-screen bg-bg">
      {/* Nav */}
      <nav className="flex items-center justify-between px-12 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-green flex items-center justify-center">
            <span className="text-white font-headline font-bold text-sm">Z</span>
          </div>
          <span className="font-headline font-bold text-xl tracking-tight">zroll</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="#features" className="text-sm text-secondary hover:text-primary transition-colors">Features</Link>
          <Link href="#pricing" className="text-sm text-secondary hover:text-primary transition-colors">Pricing</Link>
          <Link href="/sign-in" className="text-sm text-secondary hover:text-primary transition-colors">Sign In</Link>
          <Link href="/sign-up" className="bg-green text-white text-sm font-medium px-5 py-2.5 rounded-btn hover:bg-green/90 transition-colors">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto text-center pt-24 pb-20 px-6">
        <h1 className="text-5xl font-headline font-bold tracking-tight leading-[1.1]">
          Payroll that stays between
          <br />you and your team
        </h1>
        <p className="text-lg text-secondary mt-6 max-w-2xl mx-auto">
          Run payroll on Zcash. Every payment is shielded. Every pay stub lives on-chain.
          Your team gets privacy. You get compliance.
        </p>
        <div className="flex items-center justify-center gap-4 mt-10">
          <Link href="/sign-up" className="bg-green text-white font-medium px-8 py-3 rounded-btn hover:bg-green/90 transition-colors">
            Start Free
          </Link>
          <Link href="#how-it-works" className="border border-card-border text-primary font-medium px-8 py-3 rounded-btn hover:bg-white transition-colors">
            See How It Works
          </Link>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="bg-white border border-card-border rounded-card p-8 shadow-sm">
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[
              { label: "Total Payroll", value: "$253,781" },
              { label: "Contributors", value: "12" },
              { label: "Next Payroll", value: "Apr 1" },
              { label: "Shielded", value: "100%" },
            ].map((s) => (
              <div key={s.label} className="bg-table-header rounded-lg p-4">
                <p className="text-xs text-secondary">{s.label}</p>
                <p className="text-lg font-headline font-bold mt-1">{s.value}</p>
              </div>
            ))}
          </div>
          <div className="h-2 bg-green/20 rounded-full">
            <div className="h-2 bg-green rounded-full w-full" />
          </div>
          <p className="text-xs text-muted mt-2 text-center">All payments fully shielded via Orchard pool</p>
        </div>
      </section>

      {/* Problem Cards */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <h2 className="text-3xl font-headline font-bold tracking-tight text-center mb-12">
          Payroll has a privacy problem
        </h2>
        <div className="grid grid-cols-3 gap-6">
          {[
            { title: "Salary leaks", desc: "Bank transfers expose amounts to intermediaries. Wire metadata is stored forever." },
            { title: "Compliance gaps", desc: "Crypto payroll tools skip tax withholding. You're left reconciling manually." },
            { title: "No pay stubs", desc: "Blockchain payments have no attached context. Recipients can't prove what they earned." },
          ].map((card) => (
            <div key={card.title} className="bg-white border border-card-border rounded-card p-7">
              <h3 className="font-headline font-bold text-lg">{card.title}</h3>
              <p className="text-sm text-secondary mt-2 leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-5xl mx-auto px-6 pb-24">
        <h2 className="text-3xl font-headline font-bold tracking-tight text-center mb-12">
          Everything you need
        </h2>
        <div className="grid grid-cols-3 gap-6">
          {[
            { icon: Shield, title: "Shielded Payments", desc: "Every payment uses Zcash Orchard pool. Amounts, recipients, and memos are encrypted." },
            { icon: FileText, title: "On-Chain Pay Stubs", desc: "Structured pay stub data encoded into Zcash memo fields. Recipients decode with their keys." },
            { icon: Eye, title: "Selective Disclosure", desc: "Share viewing keys with auditors for compliance. They see what you allow, nothing more." },
            { icon: Zap, title: "Instant Settlement", desc: "No intermediaries. Payroll settles in under 75 seconds on Zcash mainnet." },
            { icon: Lock, title: "Tax Compliance", desc: "Automatic tax withholding, FIFO cost basis, and IRS Form 8949 exports built in." },
          ].map((f) => (
            <div key={f.title} className="bg-white border border-card-border rounded-card p-7">
              <f.icon className="w-5 h-5 text-green mb-3" />
              <h3 className="font-headline font-bold text-base">{f.title}</h3>
              <p className="text-sm text-secondary mt-1.5 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="bg-sidebar-dark py-24">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-headline font-bold tracking-tight text-center text-white mb-16">
            How it works
          </h2>
          <div className="grid grid-cols-3 gap-8">
            {[
              { step: "01", title: "Add contributors", desc: "Import your team with their Zcash shielded addresses and monthly rates." },
              { step: "02", title: "Run payroll", desc: "Review amounts, tax withholding, and ZEC conversion. Click send." },
              { step: "03", title: "Verify on-chain", desc: "Each recipient gets a shielded payment with an encrypted pay stub in the memo field." },
            ].map((s) => (
              <div key={s.step}>
                <span className="text-green font-headline font-bold text-sm">{s.step}</span>
                <h3 className="text-white font-headline font-bold text-xl mt-2">{s.title}</h3>
                <p className="text-gray-400 text-sm mt-2 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-5xl mx-auto px-6 py-24">
        <h2 className="text-3xl font-headline font-bold tracking-tight text-center mb-12">
          Pricing
        </h2>
        <div className="grid grid-cols-3 gap-6">
          {[
            { name: "Starter", price: "$0", period: "/month", features: ["Up to 5 contributors", "Shielded payments", "Basic tax reports", "Email support"], cta: "Start Free", highlight: false },
            { name: "Business", price: "$199", period: "/month", features: ["Unlimited contributors", "Advanced tax compliance", "Viewing key management", "Priority support", "CSV/PDF exports"], cta: "Get Started", highlight: true },
            { name: "Enterprise", price: "Custom", period: "", features: ["Multi-org support", "Custom integrations", "Dedicated account manager", "SLA guarantee", "On-premise option"], cta: "Contact Sales", highlight: false },
          ].map((plan) => (
            <div
              key={plan.name}
              className={`rounded-card p-7 ${plan.highlight ? "bg-sidebar-dark text-white border-2 border-green" : "bg-white border border-card-border"}`}
            >
              <h3 className={`font-headline font-bold text-lg ${plan.highlight ? "text-white" : ""}`}>
                {plan.name}
              </h3>
              <div className="mt-4">
                <span className="text-3xl font-headline font-bold">{plan.price}</span>
                {plan.period && <span className={`text-sm ${plan.highlight ? "text-gray-400" : "text-secondary"}`}>{plan.period}</span>}
              </div>
              <ul className="mt-6 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className={`text-sm flex items-center gap-2 ${plan.highlight ? "text-gray-300" : "text-secondary"}`}>
                    <span className="text-green">&#10003;</span> {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/sign-up"
                className={`mt-8 block text-center py-2.5 rounded-btn text-sm font-medium transition-colors ${
                  plan.highlight
                    ? "bg-green text-white hover:bg-green/90"
                    : "border border-card-border text-primary hover:bg-gray-50"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="bg-green rounded-card p-12 text-center">
          <h2 className="text-3xl font-headline font-bold text-white tracking-tight">
            Ready to protect your payroll?
          </h2>
          <p className="text-green-100 mt-3">
            Start running shielded payroll in under 5 minutes.
          </p>
          <Link href="/sign-up" className="mt-8 inline-block bg-white text-green font-medium px-8 py-3 rounded-btn hover:bg-green-50 transition-colors">
            Create Free Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-card-border py-12">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-green flex items-center justify-center">
              <span className="text-white font-headline font-bold text-xs">Z</span>
            </div>
            <span className="font-headline font-bold text-sm">zroll</span>
          </div>
          <p className="text-xs text-muted">&copy; 2026 Zroll. Built on Zcash.</p>
        </div>
      </footer>
    </div>
  );
}
