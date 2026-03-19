"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Send,
  Clock,
  Briefcase,
  FileText,
  Wallet,
  PieChart,
} from "lucide-react";
import { useApi } from "@/lib/use-api";
import type { DashboardStats } from "@/lib/api";

const adminItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, notifyKey: null },
  { label: "Contributors", href: "/dashboard/contributors", icon: Users, notifyKey: null },
  { label: "Run Payroll", href: "/dashboard/payroll/run", icon: Send, notifyKey: "payroll" as const },
  { label: "History", href: "/dashboard/history", icon: Clock, notifyKey: null },
  { label: "Settings", href: "/dashboard/settings", icon: Briefcase, notifyKey: null },
];

const contributorItems = [
  { label: "My Payments", href: "/portal", icon: Wallet, notifyKey: null },
  { label: "Portfolio", href: "/portal/portfolio", icon: PieChart, notifyKey: null },
  { label: "Tax Summary", href: "/portal/tax", icon: FileText, notifyKey: null },
];

interface SidebarProps {
  variant: "admin" | "contributor";
}

export function Sidebar({ variant }: SidebarProps) {
  const pathname = usePathname();
  const items = variant === "admin" ? adminItems : contributorItems;
  const { data: stats } = useApi<DashboardStats>(
    "/api/dashboard/stats",
    { skip: variant !== "admin" }
  );
  const hasPendingPayroll = stats && stats.pending_approval_count > 0;

  return (
    <aside className="fixed left-0 top-0 h-screen w-[220px] bg-sidebar-dark flex flex-col z-50">
      <div className="flex items-center gap-2.5 px-5 py-6">
        <div className="w-8 h-8 rounded-full bg-green flex items-center justify-center">
          <span className="text-white font-headline font-bold text-sm">Z</span>
        </div>
        <span className="text-white font-headline font-bold text-lg tracking-tight">
          zroll
        </span>
      </div>

      <nav className="flex-1 px-3 mt-2">
        {items.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" &&
              item.href !== "/portal" &&
              pathname.startsWith(item.href));
          const Icon = item.icon;
          const showDot = item.notifyKey === "payroll" && hasPendingPayroll;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-0.5 ${
                isActive
                  ? "bg-[rgba(5,150,105,0.1)] text-green"
                  : "text-muted hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon className="w-[18px] h-[18px]" />
              {item.label}
              {showDot && (
                <span className="ml-auto w-2 h-2 rounded-full bg-amber-400" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-6">
        <div className="border-t border-white/10 pt-4 px-3">
          <p className="text-xs text-muted">Acme Corp</p>
          <p className="text-xs text-white/60 mt-0.5">admin@acme.com</p>
        </div>
      </div>
    </aside>
  );
}
