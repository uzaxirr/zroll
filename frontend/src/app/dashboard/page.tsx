"use client";

import Link from "next/link";
import { StatCard } from "@/components/stat-card";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table";
import { Badge } from "@/components/badge";
import { useApi } from "@/lib/use-api";
import type { DashboardStats, RecentPayment } from "@/lib/api";
import { AlertCircle } from "lucide-react";

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

export default function DashboardPage() {
  const { data: stats, loading: statsLoading } = useApi<DashboardStats>("/api/dashboard/stats");
  const { data: payments, loading: paymentsLoading } = useApi<RecentPayment[]>("/api/payroll/recent?limit=5");

  if (statsLoading || paymentsLoading) {
    return <div className="flex items-center justify-center h-64"><p className="text-secondary text-sm">Loading...</p></div>;
  }

  if (!stats) return <div className="p-8 text-secondary">Failed to load dashboard data.</div>;

  return (
    <div className="space-y-section-gap">
      <PageHeader title="Dashboard" description="Overview of your payroll operations" />

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

      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="Total Payroll"
          value={`$${stats.total_payroll_usd.toLocaleString()}`}
          sub={`${stats.total_payroll_zec.toLocaleString()} ZEC`}
        />
        <StatCard
          label="Contributors"
          value={stats.contributor_count.toString()}
          sub="Active team members"
        />
        <StatCard
          label="Next Payroll"
          value={stats.next_payroll_date ? new Date(stats.next_payroll_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Not scheduled"}
          sub={`ZEC @ $${stats.current_zec_rate}`}
        />
        <StatCard
          label="Shielded"
          value={`${stats.shielded_percentage}%`}
          sub="All payments via Orchard"
          accent="green"
        />
      </div>

      <div>
        <h2 className="text-lg font-headline font-bold tracking-tight mb-4">Recent Payments</h2>
        <DataTable
          columns={columns}
          data={payments || []}
          keyExtractor={(row) => row.contributor_name + row.date}
        />
      </div>
    </div>
  );
}
