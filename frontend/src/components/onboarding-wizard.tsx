"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Building2, UserPlus, Send, Check, X } from "lucide-react";

interface OnboardingWizardProps {
  hasOrg: boolean;
  hasContributors: boolean;
  hasPayroll: boolean;
}

const steps = [
  {
    key: "org",
    label: "Set up your organization",
    description: "Add your company name and details",
    href: "/dashboard/settings",
    icon: Building2,
  },
  {
    key: "contributors",
    label: "Add your first contributor",
    description: "Invite team members to receive payments",
    href: "/dashboard/contributors",
    icon: UserPlus,
  },
  {
    key: "payroll",
    label: "Run your first payroll",
    description: "Send payments to your team via Zcash",
    href: "/dashboard/payroll/run",
    icon: Send,
  },
];

export function OnboardingWizard({ hasOrg, hasContributors, hasPayroll }: OnboardingWizardProps) {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(localStorage.getItem("zwage_onboarding_dismissed") === "true");
  }, []);

  if (dismissed) return null;

  const completed = [hasOrg, hasContributors, hasPayroll];
  const completedCount = completed.filter(Boolean).length;

  if (completedCount === 3) return null;

  const handleDismiss = () => {
    localStorage.setItem("zwage_onboarding_dismissed", "true");
    setDismissed(true);
  };

  return (
    <div className="bg-white border border-card-border rounded-card p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-headline font-bold text-base">Get started with Zwage</h3>
          <p className="text-sm text-secondary mt-1">
            {completedCount} of 3 steps completed
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="text-muted hover:text-primary transition-colors p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="w-full h-1.5 bg-gray-100 rounded-full mb-5">
        <div
          className="h-full bg-green rounded-full transition-all duration-500"
          style={{ width: `${(completedCount / 3) * 100}%` }}
        />
      </div>

      <div className="space-y-3">
        {steps.map((step, i) => {
          const Icon = step.icon;
          const done = completed[i];
          return (
            <Link
              key={step.key}
              href={step.href}
              className={`flex items-center gap-4 p-3.5 rounded-btn border transition-colors ${
                done
                  ? "border-green/20 bg-badge-green-bg"
                  : "border-card-border hover:border-green/30 hover:bg-green/5"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  done ? "bg-green" : "bg-gray-100"
                }`}
              >
                {done ? (
                  <Check className="w-4 h-4 text-white" />
                ) : (
                  <Icon className="w-4 h-4 text-secondary" />
                )}
              </div>
              <div>
                <p className={`text-sm font-medium ${done ? "text-green line-through" : "text-primary"}`}>
                  {step.label}
                </p>
                <p className="text-xs text-secondary mt-0.5">{step.description}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
