"use client";

import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table";
import { Badge } from "@/components/badge";
import { useApi } from "@/lib/use-api";
import type { DashboardStats, RecentPayment } from "@/lib/api";
import {
  AlertCircle,
  DollarSign,
  Users,
  Calendar,
  Shield,
  Send,
  UserPlus,
  TrendingUp,
  TrendingDown,
  Rocket,
  Loader2,
} from "lucide-react";

const columns = [
  {
    key: "name",
    header: "Contributor",
    render: (row: RecentPayment) => (
      <span className="font-medium text-primary">{row.contributor_name}</span>
    ),
  },
  {
    key: "department",
    header: "Department",
    render: (row: RecentPayment) => (
      <span className="text-secondary">{row.department}</span>
    ),
  },
  {
    key: "amount",
    header: "Amount",
    render: (row: RecentPayment) => (
      <div>
        <span className="font-medium font-tabular">{row.amount_zec.toFixed(2)} ZEC</span>
        <span className="text-secondary text-xs ml-1.5">${row.amount_usd.toLocaleString()}</span>
      </div>
    ),
  },
  {
    key: "date",
    header: "Date",
    render: (row: RecentPayment) => (
      <span className="text-secondary font-tabular">{row.date}</span>
    ),
  },
  {
    key: "status",
    header: "Status",
    render: (row: RecentPayment) => (
      <Badge variant="green">{row.status}</Badge>
    ),
  },
];

function getDaysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const now = new Date();
  const target = new Date(dateStr);
  const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

function getScheduleLabel(type: string): string {
  switch (type) {
    case "weekly": return "Weekly";
    case "biweekly": return "Bi-weekly";
    case "monthly": return "Monthly";
    default: return type;
  }
}

export default function DashboardPage() {
  const { data: stats, loading: statsLoading } = useApi<DashboardStats>("/api/dashboard/stats");
  const { data: payments, loading: paymentsLoading } = useApi<RecentPayment[]>("/api/payroll/recent?limit=5");

  if (statsLoading || paymentsLoading) {
    return (
      <div className="space-y-section-gap animate-pulse">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-7 w-40 bg-gray-200 rounded" />
            <div className="h-4 w-64 bg-gray-100 rounded mt-2" />
          </div>
          <div className="flex gap-3">
            <div className="h-10 w-36 bg-gray-100 rounded-btn" />
            <div className="h-10 w-32 bg-gray-200 rounded-btn" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white border border-card-border rounded-card p-6">
              <div className="flex items-center justify-between">
                <div className="h-4 w-24 bg-gray-100 rounded" />
                <div className="w-8 h-8 rounded-lg bg-gray-100" />
              </div>
              <div className="h-7 w-28 bg-gray-200 rounded mt-3" />
              <div className="h-3 w-20 bg-gray-100 rounded mt-2" />
            </div>
          ))}
        </div>
        <div>
          <div className="h-6 w-40 bg-gray-200 rounded mb-4" />
          <div className="bg-white border border-card-border rounded-card p-6 space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="h-4 w-32 bg-gray-100 rounded" />
                <div className="h-4 w-20 bg-gray-100 rounded" />
                <div className="h-4 w-24 bg-gray-100 rounded" />
                <div className="h-4 w-20 bg-gray-100 rounded" />
                <div className="h-5 w-16 bg-gray-100 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!stats) return <div className="p-8 text-secondary">Failed to load dashboard data.</div>;

  const daysUntil = getDaysUntil(stats.next_payroll_date);

  return (
    <div className="space-y-section-gap">
      <PageHeader
        title="Dashboard"
        description="Overview of your payroll operations"
        action={
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/contributors"
              className="flex items-center gap-2 border border-card-border text-primary text-sm font-medium px-5 py-2.5 rounded-btn hover:bg-gray-50 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Add Contributor
            </Link>
            <Link
              href="/dashboard/payroll/run"
              className="flex items-center gap-2 bg-green text-white text-sm font-medium px-5 py-2.5 rounded-btn hover:bg-green/90 transition-colors"
            >
              <Send className="w-4 h-4" />
              Run Payroll
            </Link>
          </div>
        }
      />

      {stats.pending_approval_count > 0 && (
        <Link
          href="/dashboard/payroll/run"
          className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-card px-5 py-4 hover:bg-amber-100 transition-colors"
        >
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-900">
              {stats.pending_approval_count} payroll run{stats.pending_approval_count > 1 ? "s" : ""} awaiting approval
            </p>
            <p className="text-xs text-amber-700 mt-0.5">Review and approve to send payments</p>
          </div>
        </Link>
      )}

      {/* Payroll schedule indicator */}
      {stats.next_payroll_date && daysUntil !== null && (
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-card px-5 py-4">
          <Calendar className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-900">
              {getScheduleLabel(stats.schedule_type)} payroll
              {daysUntil <= 0
                ? " is due today"
                : daysUntil === 1
                ? " is due tomorrow"
                : ` due in ${daysUntil} days`}
            </p>
            <p className="text-xs text-blue-700 mt-0.5">
              Next payout: {new Date(stats.next_payroll_date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
          </div>
          {daysUntil <= 3 && (
            <Link
              href="/dashboard/payroll/run"
              className="text-xs font-medium text-blue-700 border border-blue-300 px-3 py-1.5 rounded-btn hover:bg-blue-100 transition-colors"
            >
              Run now
            </Link>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-card-border rounded-card p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-secondary font-medium">Total Payroll</p>
            <div className="w-8 h-8 rounded-lg bg-green/10 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-green" />
            </div>
          </div>
          <p className="text-2xl font-headline font-bold tracking-tight mt-1.5 text-primary">
            ${stats.total_payroll_usd.toLocaleString()}
          </p>
          <p className="text-xs text-muted mt-1">{stats.total_payroll_zec.toLocaleString()} ZEC</p>
        </div>

        <div className="bg-white border border-card-border rounded-card p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-secondary font-medium">Contributors</p>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-blue-500" />
            </div>
          </div>
          <p className="text-2xl font-headline font-bold tracking-tight mt-1.5 text-primary">
            {stats.contributor_count}
          </p>
          <p className="text-xs text-muted mt-1">Active team members</p>
        </div>

        <div className="bg-white border border-card-border rounded-card p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-secondary font-medium">ZEC Rate</p>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
              {stats.current_zec_rate > 0 ? (
                <TrendingUp className="w-4 h-4 text-amber-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-amber-500" />
              )}
            </div>
          </div>
          <p className="text-2xl font-headline font-bold tracking-tight mt-1.5 text-primary">
            ${stats.current_zec_rate}
          </p>
          <p className="text-xs text-muted mt-1">Current market rate</p>
        </div>

        <div className="bg-white border border-card-border rounded-card p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-secondary font-medium">Shielded</p>
            <div className="w-8 h-8 rounded-lg bg-green/10 flex items-center justify-center">
              <Shield className="w-4 h-4 text-green" />
            </div>
          </div>
          <p className="text-2xl font-headline font-bold tracking-tight mt-1.5 text-green">
            {stats.shielded_percentage}%
          </p>
          <p className="text-xs text-muted mt-1">All payments via Orchard</p>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-headline font-bold tracking-tight mb-4">Recent Payments</h2>
        {payments && payments.length > 0 ? (
          <DataTable
            columns={columns}
            data={payments}
            keyExtractor={(row) => row.contributor_name + row.date}
          />
        ) : (
          <div className="bg-white border border-card-border rounded-card p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-green/10 flex items-center justify-center mx-auto mb-4">
              <Rocket className="w-6 h-6 text-green" />
            </div>
            <h3 className="text-base font-medium text-primary">No payments yet</h3>
            <p className="text-sm text-secondary mt-1.5 max-w-sm mx-auto">
              Add contributors and run your first payroll to get started.
            </p>
            <div className="flex items-center justify-center gap-3 mt-5">
              <Link
                href="/dashboard/contributors"
                className="text-sm font-medium border border-card-border text-primary px-4 py-2 rounded-btn hover:bg-gray-50 transition-colors"
              >
                Add Contributors
              </Link>
              <Link
                href="/dashboard/payroll/run"
                className="text-sm font-medium bg-green text-white px-4 py-2 rounded-btn hover:bg-green/90 transition-colors"
              >
                Run Payroll
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
