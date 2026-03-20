"use client";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/badge";
import { EmptyState } from "@/components/empty-state";
import { useApi, useAuthenticatedDownload } from "@/lib/use-api";
import type { TaxSummaryResponse, TaxEvent } from "@/lib/api";
import { FileText } from "lucide-react";

export default function TaxPage() {
  const { data: summary, loading: summaryLoading } = useApi<TaxSummaryResponse>("/api/contributor/tax-summary?year=2026");
  const { data: events, loading: eventsLoading } = useApi<TaxEvent[]>("/api/contributor/tax-events?year=2026&type=all");
  const { download } = useAuthenticatedDownload();

  if (summaryLoading || eventsLoading || !summary || !events) {
    return (
      <div className="space-y-section-gap animate-pulse">
        <div className="h-7 w-48 bg-gray-200 rounded" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white border border-card-border rounded-card p-6">
              <div className="h-4 w-24 bg-gray-100 rounded" />
              <div className="h-7 w-28 bg-gray-200 rounded mt-3" />
            </div>
          ))}
        </div>
        <div className="bg-white border border-card-border rounded-card p-6 space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="h-4 w-32 bg-gray-100 rounded" />
              <div className="h-4 w-20 bg-gray-100 rounded" />
              <div className="h-4 w-24 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const handleExportReport = () => {
    download("/api/contributor/tax-export", "tax-report-2026.csv", {
      method: "POST",
      body: { year: 2026, format: "csv" },
    });
  };

  return (
    <div className="space-y-section-gap">
      <PageHeader
        title="Tax Summary"
        description="2026 Tax Year"
        action={
          <button
            onClick={handleExportReport}
            className="bg-green text-white text-sm font-medium px-5 py-2.5 rounded-btn hover:bg-green/90 transition-colors"
          >
            Export Report
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-card-border rounded-card p-6">
          <p className="text-sm text-secondary font-medium">Total Income</p>
          <p className="text-2xl font-headline font-bold tracking-tight mt-1.5">${summary.total_income_usd.toLocaleString()}</p>
          <p className="text-xs text-muted mt-1">{summary.total_income_zec} ZEC across {summary.pay_periods} periods</p>
        </div>
        <div className="bg-white border border-card-border rounded-card p-6">
          <p className="text-sm text-secondary font-medium">Tax Withheld</p>
          <p className="text-2xl font-headline font-bold tracking-tight mt-1.5 text-error">${summary.tax_withheld_usd.toLocaleString()}</p>
          <p className="text-xs text-muted mt-1">Withheld by employer</p>
        </div>
        <div className="bg-white border border-card-border rounded-card p-6">
          <p className="text-sm text-secondary font-medium">Unrealized Gain</p>
          <p className="text-2xl font-headline font-bold tracking-tight mt-1.5 text-green">${summary.unrealized_gain_usd.toLocaleString()}</p>
          <p className="text-xs text-muted mt-1">{summary.cost_basis_method.toUpperCase()} cost basis</p>
        </div>
        <div className="bg-white border border-card-border rounded-card p-6">
          <p className="text-sm text-secondary font-medium">Estimated Tax Due</p>
          <p className="text-2xl font-headline font-bold tracking-tight mt-1.5 text-warning">${summary.estimated_tax_due.toLocaleString()}</p>
          <p className="text-xs text-muted mt-1">On unrealized gains</p>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-headline font-bold tracking-tight mb-4">Taxable Events</h2>
        {events.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No taxable events for 2026"
            description="Tax events will appear here as you receive payments."
          />
        ) : (
          <div className="overflow-x-auto">
            <div className="bg-white border border-card-border rounded-card overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-table-header border-b border-card-border">
                    <th className="text-left text-xs font-medium text-secondary uppercase tracking-wider px-6 py-3">Date</th>
                    <th className="text-left text-xs font-medium text-secondary uppercase tracking-wider px-6 py-3">Type</th>
                    <th className="text-left text-xs font-medium text-secondary uppercase tracking-wider px-6 py-3">Amount (ZEC)</th>
                    <th className="text-left text-xs font-medium text-secondary uppercase tracking-wider px-6 py-3">Cost Basis</th>
                    <th className="text-left text-xs font-medium text-secondary uppercase tracking-wider px-6 py-3">Fair Value</th>
                    <th className="text-left text-xs font-medium text-secondary uppercase tracking-wider px-6 py-3">Gain / Loss</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((e, i) => (
                    <tr key={e.date + e.event_type + i} className="border-b border-row-border last:border-0 hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-tabular">{e.date}</td>
                      <td className="px-6 py-4">
                        <Badge variant={e.event_type === "income" ? "indigo" : "amber"}>
                          {e.event_type.charAt(0).toUpperCase() + e.event_type.slice(1)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm font-tabular font-medium">{e.amount_zec}</td>
                      <td className="px-6 py-4 text-sm font-tabular text-secondary">${e.cost_basis_usd.toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm font-tabular text-secondary">${e.fair_value_usd.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className={`text-sm font-tabular font-medium ${
                          e.gain_loss_usd > 0 ? "text-green" : e.gain_loss_usd < 0 ? "text-error" : "text-secondary"
                        }`}>
                          {e.gain_loss_usd > 0 ? "+" : ""}${e.gain_loss_usd.toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
