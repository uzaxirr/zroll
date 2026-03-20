"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { CheckCircle } from "lucide-react";
import { useApi } from "@/lib/use-api";
import type { PayrollRun } from "@/lib/api";

export default function PayrollSuccessPage() {
  const params = useParams();
  const runId = params.id as string;
  const { data: run, loading } = useApi<PayrollRun>(`/api/payroll/${runId}`);

  if (loading || !run) {
    return <div className="flex items-center justify-center h-64"><p className="text-secondary text-sm">Loading transaction details...</p></div>;
  }

  return (
    <div className="max-w-2xl mx-auto py-12">
      <div className="text-center mb-10">
        <div className="w-16 h-16 bg-badge-green-bg rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle className="w-8 h-8 text-green" />
        </div>
        <h1 className="text-2xl font-headline font-bold tracking-tight">Payroll Sent Successfully</h1>
        <p className="text-sm text-secondary mt-2">{run.period_label} payroll has been processed via shielded transactions.</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-card-border rounded-card p-5 text-center">
          <p className="text-xs text-secondary">Total Sent</p>
          <p className="text-xl font-headline font-bold mt-1">{run.total_zec} ZEC</p>
          <p className="text-xs text-muted mt-0.5">${run.total_usd.toLocaleString()}</p>
        </div>
        <div className="bg-white border border-card-border rounded-card p-5 text-center">
          <p className="text-xs text-secondary">Recipients</p>
          <p className="text-xl font-headline font-bold mt-1">{run.recipient_count}</p>
          <p className="text-xs text-muted mt-0.5">Contributors paid</p>
        </div>
        <div className="bg-white border border-card-border rounded-card p-5 text-center">
          <p className="text-xs text-secondary">Network Fee</p>
          <p className="text-xl font-headline font-bold mt-1">{run.network_fee_zec} ZEC</p>
          <p className="text-xs text-muted mt-0.5">${run.total_zec > 0 ? (run.network_fee_zec * (run.total_usd / run.total_zec)).toFixed(2) : "0.00"}</p>
        </div>
      </div>

      <div className="bg-sidebar-dark rounded-card p-7">
        <h3 className="text-white font-headline font-bold text-sm mb-5">Transaction Details</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Transaction ID</span>
            {run.tx_id ? (
              <a
                href={`https://testnet.cipherscan.app/tx/${run.tx_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-green font-mono hover:underline break-all text-right max-w-[70%]"
              >
                {run.tx_id}
              </a>
            ) : (
              <span className="text-sm text-white font-mono">Pending</span>
            )}
          </div>
          {[
            { label: "Block Height", value: run.block_height ? run.block_height.toLocaleString() : "Pending" },
            { label: "Confirmations", value: run.confirmations.toString() },
            { label: "Pool", value: run.pool ? run.pool.charAt(0).toUpperCase() + run.pool.slice(1) : "Orchard" },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <span className="text-sm text-gray-400">{item.label}</span>
              <span className="text-sm text-white font-mono">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 mt-10">
        <Link href="/dashboard/history" className="border border-card-border text-primary font-medium px-6 py-2.5 rounded-btn hover:bg-white transition-colors text-sm">
          View Details
        </Link>
        <Link href="/dashboard" className="bg-green text-white font-medium px-6 py-2.5 rounded-btn hover:bg-green/90 transition-colors text-sm">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
