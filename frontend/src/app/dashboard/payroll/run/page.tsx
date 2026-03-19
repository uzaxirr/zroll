"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { StatCard } from "@/components/stat-card";
import { PageHeader } from "@/components/page-header";
import { useApi, useApiPost } from "@/lib/use-api";
import type { PayrollPrepare, PayrollExecuteBody, PayrollZodlResponse } from "@/lib/api";
import { Loader2 } from "lucide-react";

export default function RunPayrollPage() {
  const router = useRouter();
  const { data, loading } = useApi<PayrollPrepare>("/api/payroll/prepare");
  const { post, loading: sending } = useApiPost<PayrollExecuteBody, { payroll_run_id: string; status: string }>();
  const { post: postZodl, loading: sendingZodl } = useApiPost<PayrollExecuteBody, PayrollZodlResponse>();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    if (data) {
      setSelected(new Set(data.contributors.map((c) => c.id)));
    }
  }, [data]);

  if (loading || !data) {
    return (
      <div className="space-y-section-gap animate-pulse">
        <div>
          <div className="h-7 w-32 bg-gray-200 rounded" />
          <div className="h-4 w-48 bg-gray-100 rounded mt-2" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white border border-card-border rounded-card p-5">
              <div className="h-3 w-20 bg-gray-100 rounded" />
              <div className="h-7 w-24 bg-gray-200 rounded mt-2" />
              <div className="h-3 w-16 bg-gray-100 rounded mt-2" />
            </div>
          ))}
        </div>
        <div className="bg-white border border-card-border rounded-card p-6 space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-6">
              <div className="w-4 h-4 bg-gray-100 rounded" />
              <div className="h-4 w-28 bg-gray-200 rounded" />
              <div className="h-4 w-20 bg-gray-100 rounded" />
              <div className="h-4 w-20 bg-gray-100 rounded" />
              <div className="h-4 w-16 bg-gray-100 rounded" />
              <div className="h-4 w-24 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-3">
          <div className="h-12 w-40 bg-gray-100 rounded-btn" />
          <div className="h-12 w-44 bg-gray-200 rounded-btn" />
        </div>
      </div>
    );
  }

  const departments = ["All", ...Array.from(new Set(data.contributors.map((c) => c.department)))];
  const filtered = filter === "All" ? data.contributors : data.contributors.filter((c) => c.department === filter);

  const selectedContributors = data.contributors.filter((c) => selected.has(c.id));
  const totalUsd = selectedContributors.reduce((sum, c) => sum + c.monthly_rate_usd, 0);
  const totalZec = totalUsd / data.zec_rate_usd;

  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((c) => c.id)));
    }
  };

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const handleSend = async () => {
    const items = selectedContributors.map((c) => ({
      contributor_id: c.id,
      gross_usd: c.monthly_rate_usd,
      tax_withheld_usd: c.monthly_rate_usd * c.tax_rate,
    }));

    const now = new Date();
    const result = await post("/api/payroll/execute", {
      period_label: data.period,
      period_start: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`,
      period_end: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()}`,
      items,
      lock_zec_rate: true,
    });

    router.push(`/dashboard/payroll/${result.payroll_run_id}/success`);
  };

  const handleZodl = async () => {
    const items = selectedContributors.map((c) => ({
      contributor_id: c.id,
      gross_usd: c.monthly_rate_usd,
      tax_withheld_usd: c.monthly_rate_usd * c.tax_rate,
    }));

    const now = new Date();
    const result = await postZodl("/api/payroll/execute-zodl", {
      period_label: data.period,
      period_start: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`,
      period_end: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()}`,
      items,
      lock_zec_rate: true,
    });

    router.push(`/dashboard/payroll/${result.payroll_run_id}/sign`);
  };

  return (
    <div className="space-y-section-gap">
      <PageHeader title="Run Payroll" description={`Period: ${data.period}`} />

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total This Run" value={`$${totalUsd.toLocaleString()}`} sub={`${totalZec.toFixed(2)} ZEC`} />
        <StatCard label="Recipients" value={selected.size.toString()} sub={`of ${data.contributors.length} contributors`} />
        <StatCard label="Est. Fee" value={`${data.estimated_network_fee} ZEC`} sub={`$${(data.estimated_network_fee * data.zec_rate_usd).toFixed(2)}`} />
      </div>

      <div className="flex items-center gap-2">
        {departments.map((dept) => (
          <button
            key={dept}
            onClick={() => setFilter(dept)}
            className={`px-4 py-1.5 rounded-badge text-sm font-medium transition-colors ${
              filter === dept
                ? "bg-primary text-white"
                : "bg-white border border-card-border text-secondary hover:bg-gray-50"
            }`}
          >
            {dept}
          </button>
        ))}
      </div>

      <div className="bg-white border border-card-border rounded-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-table-header border-b border-card-border">
              <th className="text-left px-6 py-3 w-12">
                <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleAll} className="rounded border-card-border accent-green" />
              </th>
              <th className="text-left text-xs font-medium text-secondary uppercase tracking-wider px-6 py-3">Contributor</th>
              <th className="text-left text-xs font-medium text-secondary uppercase tracking-wider px-6 py-3">Department</th>
              <th className="text-left text-xs font-medium text-secondary uppercase tracking-wider px-6 py-3">Gross (USD)</th>
              <th className="text-left text-xs font-medium text-secondary uppercase tracking-wider px-6 py-3">Tax</th>
              <th className="text-left text-xs font-medium text-secondary uppercase tracking-wider px-6 py-3">Net (ZEC)</th>
              <th className="text-left text-xs font-medium text-secondary uppercase tracking-wider px-6 py-3">Wallet</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => {
              const tax = c.monthly_rate_usd * c.tax_rate;
              const net = c.monthly_rate_usd - tax;
              const zec = net / data.zec_rate_usd;
              return (
                <tr key={c.id} className="border-b border-row-border last:border-0 hover:bg-gray-50/50">
                  <td className="px-6 py-4">
                    <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggle(c.id)} className="rounded border-card-border accent-green" />
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">{c.name}</td>
                  <td className="px-6 py-4 text-sm text-secondary">{c.department}</td>
                  <td className="px-6 py-4 text-sm font-tabular">${c.monthly_rate_usd.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm font-tabular text-error">-${tax.toFixed(0)}</td>
                  <td className="px-6 py-4 text-sm font-tabular font-medium">{zec.toFixed(2)} ZEC</td>
                  <td className="px-6 py-4 text-sm text-muted font-mono text-xs">{c.wallet_address_masked}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end gap-3">
        <button
          onClick={handleSend}
          disabled={selected.size === 0 || sending || sendingZodl}
          className="border border-card-border text-primary font-medium px-8 py-3 rounded-btn hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {sending && <Loader2 className="w-4 h-4 animate-spin" />}
          {sending ? "Sending..." : "Send from Server"}
        </button>
        <button
          onClick={handleZodl}
          disabled={selected.size === 0 || sending || sendingZodl}
          className="bg-green text-white font-medium px-8 py-3 rounded-btn hover:bg-green/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {sendingZodl && <Loader2 className="w-4 h-4 animate-spin" />}
          {sendingZodl ? "Preparing..." : `Sign with Zodl (${selected.size})`}
        </button>
      </div>
    </div>
  );
}
