"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Check, ExternalLink, Loader2 } from "lucide-react";
import { StatCard } from "@/components/stat-card";
import { PageHeader } from "@/components/page-header";
import { useApi, useApiPost } from "@/lib/use-api";
import type { PayrollRun } from "@/lib/api";

export default function SignWithZodlPage() {
  const params = useParams();
  const router = useRouter();
  const runId = params.id as string;
  const { data: run, loading } = useApi<PayrollRun>(`/api/payroll/${runId}`);
  const { post, loading: confirming } = useApiPost<{ tx_id: string }, { status: string }>();
  const [txId, setTxId] = useState("");
  const [copied, setCopied] = useState(false);

  if (loading || !run) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-secondary text-sm">Loading payroll details...</p>
      </div>
    );
  }

  if (run.status !== "pending_approval") {
    router.push(`/dashboard/payroll/${runId}/success`);
    return null;
  }

  const paymentUri = run.payment_uri || "";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(paymentUri);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirm = async () => {
    if (!txId.trim()) return;
    await post(`/api/payroll/${runId}/confirm-tx`, { tx_id: txId.trim() });
    router.push(`/dashboard/payroll/${runId}/success`);
  };

  return (
    <div className="space-y-section-gap max-w-3xl mx-auto">
      <PageHeader title="Sign with Zodl" description={`${run.period_label} payroll`} />

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total" value={`${run.total_zec} ZEC`} sub={`$${run.total_usd.toLocaleString()}`} />
        <StatCard label="Recipients" value={run.recipient_count.toString()} sub="Contributors" />
        <StatCard label="Status" value="Awaiting Signature" sub="Sign in Zodl to proceed" />
      </div>

      {/* QR Code + Deep Link */}
      <div className="bg-white border border-card-border rounded-card p-8">
        <div className="flex flex-col items-center gap-6">
          <h2 className="text-lg font-headline font-bold">Scan with Zodl</h2>
          <p className="text-sm text-secondary text-center max-w-md">
            Scan this QR code with the Zodl app on your phone, or tap the button below if you are on mobile.
          </p>

          <div className="bg-white p-4 rounded-lg border border-gray-100">
            <QRCodeSVG value={paymentUri} size={240} level="M" />
          </div>

          <a
            href={paymentUri}
            className="bg-green text-white font-medium px-6 py-2.5 rounded-btn hover:bg-green/90 transition-colors text-sm inline-flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            Open in Zodl
          </a>

          {/* Copyable URI */}
          <div className="w-full">
            <div className="flex items-center gap-2 bg-gray-50 border border-card-border rounded-lg p-3">
              <code className="text-xs text-muted font-mono flex-1 break-all line-clamp-2">
                {paymentUri}
              </code>
              <button
                onClick={handleCopy}
                className="text-secondary hover:text-primary transition-colors flex-shrink-0"
                title="Copy URI"
              >
                {copied ? <Check className="w-4 h-4 text-green" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recipient Breakdown */}
      {run.items && run.items.length > 0 && (
        <div className="bg-white border border-card-border rounded-card overflow-hidden">
          <div className="px-6 py-4 border-b border-card-border">
            <h3 className="font-headline font-bold text-sm">Recipients</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr className="bg-table-header border-b border-card-border">
                <th className="text-left text-xs font-medium text-secondary uppercase tracking-wider px-6 py-3">Contributor</th>
                <th className="text-left text-xs font-medium text-secondary uppercase tracking-wider px-6 py-3">Department</th>
                <th className="text-left text-xs font-medium text-secondary uppercase tracking-wider px-6 py-3">Net (USD)</th>
                <th className="text-left text-xs font-medium text-secondary uppercase tracking-wider px-6 py-3">Amount (ZEC)</th>
              </tr>
            </thead>
            <tbody>
              {run.items.map((item, i) => (
                <tr key={i} className="border-b border-row-border last:border-0">
                  <td className="px-6 py-3 text-sm font-medium">{item.contributor_name}</td>
                  <td className="px-6 py-3 text-sm text-secondary">{item.department}</td>
                  <td className="px-6 py-3 text-sm font-tabular">${item.net_usd.toLocaleString()}</td>
                  <td className="px-6 py-3 text-sm font-tabular font-medium">{item.zec_amount} ZEC</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirm Transaction */}
      <div className="bg-white border border-card-border rounded-card p-6">
        <h3 className="font-headline font-bold text-sm mb-2">Confirm Transaction</h3>
        <p className="text-sm text-secondary mb-4">
          After signing in Zodl, paste the transaction ID below to complete the payroll run.
        </p>
        <div className="flex gap-3">
          <input
            type="text"
            value={txId}
            onChange={(e) => setTxId(e.target.value)}
            placeholder="Paste transaction ID..."
            className="flex-1 border border-card-border rounded-btn px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green/30 focus:border-green"
          />
          <button
            onClick={handleConfirm}
            disabled={!txId.trim() || confirming}
            className="bg-green text-white font-medium px-6 py-2.5 rounded-btn hover:bg-green/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm inline-flex items-center gap-2"
          >
            {confirming ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Confirming...
              </>
            ) : (
              "Confirm"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
