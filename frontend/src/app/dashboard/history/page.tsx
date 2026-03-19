"use client";

import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table";
import { Badge } from "@/components/badge";
import { useApi, useAuthenticatedDownload } from "@/lib/use-api";
import type { PayrollRun, PayrollHistoryResponse } from "@/lib/api";
import Link from "next/link";

const columns = [
  {
    key: "period",
    header: "Pay Period",
    render: (row: PayrollRun) => <span className="font-medium">{row.period_label}</span>,
  },
  {
    key: "date",
    header: "Run Date",
    render: (row: PayrollRun) => <span className="text-secondary font-tabular">{row.executed_at}</span>,
  },
  {
    key: "recipients",
    header: "Recipients",
    render: (row: PayrollRun) => <span className="font-tabular">{row.recipient_count}</span>,
  },
  {
    key: "zec",
    header: "Total ZEC",
    render: (row: PayrollRun) => <span className="font-tabular font-medium">{row.total_zec.toFixed(2)}</span>,
  },
  {
    key: "usd",
    header: "Total USD",
    render: (row: PayrollRun) => <span className="text-secondary font-tabular">${row.total_usd.toLocaleString()}</span>,
  },
  {
    key: "status",
    header: "Status",
    render: (row: PayrollRun) => (
      <Badge variant={row.status === "completed" ? "green" : row.status === "failed" ? "red" : "amber"}>
        {row.status}
      </Badge>
    ),
  },
  {
    key: "action",
    header: "",
    render: (row: PayrollRun) => (
      <Link href={`/dashboard/payroll/${row.id}/success`} className="text-green text-sm font-medium hover:underline">
        View
      </Link>
    ),
  },
];

export default function HistoryPage() {
  const { data, loading } = useApi<PayrollHistoryResponse>("/api/payroll/history?page=1&limit=20");
  const { download } = useAuthenticatedDownload();

  if (loading || !data) {
    return <div className="flex items-center justify-center h-64"><p className="text-secondary text-sm">Loading history...</p></div>;
  }

  const handleExportCSV = () => {
    download("/api/payroll/history/export?format=csv", "payroll-history.csv");
  };

  return (
    <div className="space-y-section-gap">
      <PageHeader
        title="Payroll History"
        description="All payroll runs"
        action={
          <button
            onClick={handleExportCSV}
            className="border border-card-border text-primary text-sm font-medium px-5 py-2.5 rounded-btn hover:bg-white transition-colors"
          >
            Export CSV
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={data.runs}
        keyExtractor={(row) => row.id}
      />
    </div>
  );
}
