"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { SectionLabel } from "./SectionLabel";

const tiers = [
  {
    name: "Starter",
    price: "$99",
    period: "/mo",
    description: "For small teams getting started with crypto payroll",
    features: [
      "Up to 10 contributors",
      "Shielded ZEC payments",
      "Basic tax reporting",
      "Email support",
      "CSV export",
    ],
    cta: "Start Free Trial",
    href: "/sign-up",
    highlighted: false,
  },
  {
    name: "Growth",
    price: "$299",
    period: "/mo",
    description: "For growing teams that need more power and flexibility",
    features: [
      "Up to 100 contributors",
      "Multi-chain support",
      "Advanced tax & compliance",
      "Viewing key management",
      "Priority support",
      "API access",
    ],
    cta: "Start Free Trial",
    href: "/sign-up",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For organizations with advanced security and compliance needs",
    features: [
      "Unlimited contributors",
      "SSO & 2FA",
      "Dedicated account manager",
      "Custom integrations",
      "SLA guarantee",
      "Audit logs & compliance",
    ],
    cta: "Contact Sales",
    href: "mailto:sales@zwage.io",
    highlighted: false,
  },
];

export function Pricing() {
  return (
    <section className="relative py-32 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <SectionLabel>Pricing</SectionLabel>
          <h2
            className="font-headline font-bold text-white mt-5"
            style={{ fontSize: 44, letterSpacing: "-0.03em", lineHeight: "52px" }}
          >
            Simple, transparent pricing
          </h2>
          <p
            className="mt-5 mx-auto max-w-lg"
            style={{ fontSize: 16, lineHeight: "28px", color: "rgba(255,255,255,0.45)" }}
          >
            Start free, upgrade as you grow. No hidden fees.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map((tier, i) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className={`relative rounded-2xl p-8 flex flex-col ${
                tier.highlighted
                  ? "border-2 border-green bg-white/[0.04]"
                  : "border border-white/[0.06] bg-white/[0.02]"
              }`}
            >
              {tier.highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green text-white text-xs font-semibold px-3 py-1 rounded-full">
                  Most Popular
                </span>
              )}

              <h3 className="font-headline font-bold text-lg text-white">{tier.name}</h3>
              <div className="flex items-baseline gap-1 mt-4">
                <span className="font-headline font-bold text-4xl text-white tracking-tight">
                  {tier.price}
                </span>
                {tier.period && (
                  <span className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
                    {tier.period}
                  </span>
                )}
              </div>
              <p className="text-sm mt-3" style={{ color: "rgba(255,255,255,0.45)" }}>
                {tier.description}
              </p>

              <ul className="mt-8 space-y-3 flex-1">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-green mt-0.5 flex-shrink-0" />
                    <span className="text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <a
                href={tier.href}
                className={`mt-8 flex items-center justify-center text-sm font-semibold rounded-full h-12 transition-all duration-200 ${
                  tier.highlighted
                    ? "bg-green text-white hover:brightness-110"
                    : "border border-white/15 text-white hover:bg-white/5"
                }`}
              >
                {tier.cta}
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
