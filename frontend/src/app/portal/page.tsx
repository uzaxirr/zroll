"use client";

import { useState } from "react";
import { StatCard } from "@/components/stat-card";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/badge";
import { EmptyState } from "@/components/empty-state";
import { useApi } from "@/lib/use-api";
import type { ContributorStats, ContributorPaymentsResponse, ContributorPayment, PayStub, ContributorViewingKey } from "@/lib/api";
import { X, CheckCircle, Clock, AlertTriangle, Eye, Copy, Check, Wallet } from "lucide-react";

interface TxStatus {
  tx_id: string;
  confirmations: number | null;
  block_height: number | null;
  timestamp: string | null;
  confirmed: boolean | null;
}

function TxConfirmation({ txId }: { txId: string }) {
  const { data, loading } = useApi<TxStatus>(`/api/contributor/tx-status/${txId}`);

  if (loading || !data) return <span className="text-xs text-muted">Loading...</span>;
  if (data.confirmations === null) return (
    <a href={`https://testnet.cipherscan.app/tx/${txId}`} target="_blank" rel="noopener noreferrer" className="text-green text-sm font-medium hover:underline">
      Verify
    </a>
  );

  return (
    <div className="flex items-center gap-2">
      <a href={`https://testnet.cipherscan.app/tx/${txId}`} target="_blank" rel="noopener noreferrer" className="text-green text-sm font-medium hover:underline">
        Verify
      </a>
      <span className={`text-xs font-tabular ${data.confirmations >= 10 ? "text-green-700" : data.confirmations >= 1 ? "text-amber-600" : "text-muted"}`}>
        {data.confirmations} conf.
      </span>
    </div>
  );
}

export default function PortalPage() {
  const { data: stats, loading: statsLoading } = useApi<ContributorStats>("/api/contributor/stats");
  const { data: paymentsData, loading: paymentsLoading } = useApi<ContributorPaymentsResponse>("/api/contributor/payments?page=1");
  const { data: viewingKeyData } = useApi<ContributorViewingKey>("/api/contributor/viewing-key");
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedStub, setSelectedStub] = useState<string | null>(null);
  const { data: stub } = useApi<PayStub>(
    `/api/contributor/payments/${selectedStub}/stub`,
    { skip: !selectedStub }
  );

  if (statsLoading || paymentsLoading || !stats || !paymentsData) {
    return (
      <div className="space-y-section-gap animate-pulse">
        <div className="h-7 w-48 bg-gray-200 rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white border border-card-border rounded-card p-6">
              <div className="h-4 w-24 bg-gray-100 rounded" />
              <div className="h-7 w-28 bg-gray-200 rounded mt-3" />
              <div className="h-3 w-20 bg-gray-100 rounded mt-2" />
            </div>
          ))}
        </div>
        <div className="bg-white border border-card-border rounded-card p-6 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="h-4 w-32 bg-gray-100 rounded" />
              <div className="h-4 w-20 bg-gray-100 rounded" />
              <div className="h-4 w-24 bg-gray-100 rounded" />
              <div className="h-5 w-16 bg-gray-100 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const payments = paymentsData.payments;

  return (
    <div className="space-y-section-gap">
      <PageHeader title="My Payments" description={stats.organizations.length > 0 ? `Paid by ${stats.organizations.join(", ")}` : "Your payment history"} />

      {stats.verification_status !== "verified" && (
        <div className={`flex items-center gap-3 rounded-card px-5 py-4 ${
          stats.verification_status === "test_sent"
            ? "bg-amber-50 border border-amber-200"
            : "bg-gray-50 border border-card-border"
        }`}>
          {stats.verification_status === "test_sent" ? (
            <Clock className="w-5 h-5 text-amber-600 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-gray-400 flex-shrink-0" />
          )}
          <div>
            <p className={`text-sm font-medium ${stats.verification_status === "test_sent" ? "text-amber-900" : "text-secondary"}`}>
              {stats.verification_status === "test_sent"
                ? "Wallet verification in progress"
                : "Wallet not yet verified"}
            </p>
            <p className={`text-xs mt-0.5 ${stats.verification_status === "test_sent" ? "text-amber-700" : "text-muted"}`}>
              {stats.verification_status === "test_sent"
                ? "A test transaction of 0.0001 ZEC was sent to your wallet. Awaiting blockchain confirmation."
                : "Your organization will send a test transaction to verify your wallet address."}
            </p>
            {stats.test_tx_id && (
              <a
                href={`https://testnet.cipherscan.app/tx/${stats.test_tx_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-green hover:underline mt-1 inline-block"
              >
                View transaction
              </a>
            )}
          </div>
        </div>
      )}

      {stats.verification_status === "verified" && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-card px-5 py-3">
          <CheckCircle className="w-4 h-4 text-green flex-shrink-0" />
          <p className="text-sm text-green-800">Wallet verified. You are eligible for payroll.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          label="Total Received"
          value={`${stats.total_received_zec} ZEC`}
          sub={`$${stats.total_received_usd.toLocaleString()}`}
        />
        <StatCard
          label="Last Payment"
          value={`${stats.last_payment_zec} ZEC`}
          sub={stats.last_payment_date}
        />
        <StatCard
          label="Organizations"
          value={stats.organization_count.toString()}
          sub={stats.organizations[0]}
        />
      </div>

      {viewingKeyData?.has_key && (
        <div className="bg-white border border-card-border rounded-card p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-green" />
              <h3 className="font-headline font-bold text-base">Viewing Key</h3>
              <Badge variant="green">{viewingKeyData.key_type}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowKey(!showKey)}
                className="text-sm text-secondary hover:text-primary transition-colors"
              >
                {showKey ? "Hide" : "Reveal"}
              </button>
              {showKey && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(viewingKeyData.viewing_key || "");
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="text-sm text-green hover:text-green/80 transition-colors flex items-center gap-1"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied" : "Copy"}
                </button>
              )}
            </div>
          </div>
          {showKey ? (
            <pre className="bg-gray-50 border border-card-border rounded-btn px-4 py-3 text-xs font-mono break-all whitespace-pre-wrap">
              {viewingKeyData.viewing_key}
            </pre>
          ) : (
            <p className="text-sm text-muted">Use this key to independently verify your payments on-chain. Click Reveal to view it.</p>
          )}
        </div>
      )}

      <div className="flex gap-6">
        <div className={`${selectedStub ? "flex-1" : "w-full"} transition-all`}>
          <h2 className="text-lg font-headline font-bold tracking-tight mb-4">Payment History</h2>
          {payments.length === 0 ? (
            <EmptyState
              icon={Wallet}
              title="No payments received yet"
              description="Once your organization runs payroll, your payments will appear here."
            />
          ) : (
            <div className="overflow-x-auto">
              <div className="bg-white border border-card-border rounded-card overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-table-header border-b border-card-border">
                      <th className="text-left text-xs font-medium text-secondary uppercase tracking-wider px-6 py-3">Date</th>
                      <th className="text-left text-xs font-medium text-secondary uppercase tracking-wider px-6 py-3">From</th>
                      <th className="text-left text-xs font-medium text-secondary uppercase tracking-wider px-6 py-3">Amount</th>
                      <th className="text-left text-xs font-medium text-secondary uppercase tracking-wider px-6 py-3">Status</th>
                      <th className="text-left text-xs font-medium text-secondary uppercase tracking-wider px-6 py-3">On-Chain</th>
                      <th className="text-left text-xs font-medium text-secondary uppercase tracking-wider px-6 py-3">Reference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p: ContributorPayment) => (
                      <tr key={p.payroll_item_id} className="border-b border-row-border last:border-0 hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 text-sm font-tabular">{p.date}</td>
                        <td className="px-6 py-4 text-sm text-secondary">{p.from}</td>
                        <td className="px-6 py-4">
                          <div>
                            <span className="text-sm font-medium font-tabular">{p.amount_zec} ZEC</span>
                            <span className="text-xs text-muted ml-1.5">${p.amount_usd.toLocaleString()}</span>
                          </div>
                          {p.memo && (
                            <div className="text-xs text-muted mt-1">
                              Gross ${p.memo.gross.toLocaleString()} · Tax ${Math.abs(p.memo.tax).toLocaleString()} · Rate ${p.memo.rate}/ZEC
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="green">{p.status}</Badge>
                        </td>
                        <td className="px-6 py-4">
                          {p.tx_id ? (
                            <TxConfirmation txId={p.tx_id} />
                          ) : (
                            <span className="text-xs text-muted">Pending</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {p.memo && (
                            <span className="text-xs text-muted font-mono">{p.memo.ref}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {selectedStub && stub && (
          <div className="w-[360px] flex-shrink-0">
            <div className="bg-white border border-card-border rounded-card p-6 sticky top-10">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <h3 className="font-headline font-bold text-base">Pay Stub</h3>
                  <Badge variant="green">From Memo</Badge>
                </div>
                <button onClick={() => setSelectedStub(null)} className="text-muted hover:text-primary">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                {[
                  { label: "Organization", value: stub.organization },
                  { label: "Period", value: stub.period },
                  { label: "Type", value: stub.type },
                  { label: "Gross", value: `$${stub.gross_usd.toLocaleString()}` },
                  { label: "Tax Withheld", value: `$${stub.tax_withheld_usd.toLocaleString()}` },
                  { label: "Net Pay", value: `$${stub.net_usd.toLocaleString()}` },
                  { label: "ZEC Rate", value: `$${stub.zec_rate}` },
                  { label: "ZEC Amount", value: `${stub.zec_amount} ZEC` },
                  { label: "Reference", value: stub.reference },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-2 border-b border-row-border last:border-0">
                    <span className="text-sm text-secondary">{item.label}</span>
                    <span className="text-sm font-medium font-tabular">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
