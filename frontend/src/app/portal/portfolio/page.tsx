"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { useApi } from "@/lib/use-api";
import type { PortfolioResponse, ContributorTransaction } from "@/lib/api";
import { ArrowDownLeft, ArrowUpRight, ArrowDownUp } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";

const periods = ["7D", "1M", "3M", "1Y", "All"];
const periodMap: Record<string, string> = { "7D": "7d", "1M": "1m", "3M": "3m", "1Y": "1y", "All": "all" };

export default function PortfolioPage() {
  const [period, setPeriod] = useState("7D");
  const { data, loading } = useApi<PortfolioResponse>(`/api/contributor/portfolio?period=${periodMap[period]}`);
  const { data: transactions, loading: txLoading } = useApi<ContributorTransaction[]>("/api/contributor/transactions?limit=5");

  if (loading || txLoading || !data || !transactions) {
    return (
      <div className="space-y-section-gap animate-pulse">
        <div className="h-7 w-48 bg-gray-200 rounded" />
        <div className="bg-white border border-card-border rounded-card p-6">
          <div className="h-[200px] bg-gray-100 rounded" />
        </div>
        <div className="bg-white border border-card-border rounded-card p-6 space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="h-4 w-32 bg-gray-100 rounded" />
              <div className="h-4 w-20 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const chartData = data.chart_data?.map((d) => ({
    date: new Date(d.timestamp).toLocaleDateString("en-US", { month: "short" }),
    value: d.value_usd,
  })) || [
    { date: "Oct", value: 4200 },
    { date: "Nov", value: 4800 },
    { date: "Dec", value: 5100 },
    { date: "Jan", value: 4900 },
    { date: "Feb", value: 5600 },
    { date: "Mar", value: 6200 },
  ];

  return (
    <div className="space-y-section-gap">
      <PageHeader title="Portfolio" />

      <div className="bg-white border border-card-border rounded-card p-7">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-sm text-secondary">Total Value</p>
            <p className="text-3xl font-headline font-bold tracking-tight mt-1">
              ${data.balance_usd.toLocaleString()}
            </p>
            <p className="text-sm mt-1">
              <span className="text-gold font-medium font-tabular">{data.balance_zec} ZEC</span>
              <span className="text-muted ml-2">@ ${data.zec_rate}/ZEC</span>
            </p>
          </div>
          <div className="text-right">
            <span className={`text-sm font-medium font-tabular ${data.change_usd >= 0 ? "text-green" : "text-error"}`}>
              {data.change_usd >= 0 ? "+" : ""}${data.change_usd.toLocaleString()} ({data.change_pct}%)
            </span>
            <p className="text-xs text-muted mt-0.5">Past {period}</p>
          </div>
        </div>

        <div className="mb-4">
          <h3 className="font-headline font-bold text-base mb-4">Portfolio Value</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#059669" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#059669" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9CA3AF" axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 13 }}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(value: any) => [`$${Number(value).toLocaleString()}`, "Value"]}
              />
              <Area type="monotone" dataKey="value" stroke="#059669" strokeWidth={2} fill="url(#portfolioGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center gap-1 justify-center">
          {periods.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 rounded-btn text-sm font-medium transition-colors ${
                period === p
                  ? "bg-primary text-white"
                  : "text-secondary hover:bg-gray-100"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-headline font-bold tracking-tight mb-4">Recent Transactions</h2>
        {transactions.length === 0 ? (
          <EmptyState
            icon={ArrowDownUp}
            title="No transactions yet"
            description="Your on-chain transactions will appear here once you receive payments."
          />
        ) : (
          <div className="bg-white border border-card-border rounded-card overflow-hidden">
            {transactions.map((tx, i) => (
              <div
                key={tx.date + tx.type + i}
                className={`flex items-center justify-between px-6 py-4 ${i > 0 ? "border-t border-row-border" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    tx.direction === "incoming" ? "bg-badge-green-bg" : "bg-badge-amber-bg"
                  }`}>
                    {tx.direction === "incoming" ? (
                      <ArrowDownLeft className="w-4 h-4 text-green" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4 text-warning" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{tx.description}</p>
                    <p className="text-xs text-muted">{tx.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-medium font-tabular ${tx.direction === "incoming" ? "text-green" : "text-primary"}`}>
                    {tx.direction === "incoming" ? "+" : ""}{tx.amount_zec} ZEC
                  </p>
                  <p className="text-xs text-muted font-tabular">${tx.amount_usd.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
