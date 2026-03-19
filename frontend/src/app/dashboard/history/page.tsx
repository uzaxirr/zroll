"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/badge";
import { Eye, Loader2, Shield, Lock } from "lucide-react";

interface ChainTransaction {
  tx_id: string;
  block_height: number;
  amount_zec: number;
  memo: string | null;
  status: string;
}

interface ChainResponse {
  balance_zec: number;
  transactions: ChainTransaction[];
}

function parseMemo(memo: string | null): {
  org?: string;
  period?: string;
  type?: string;
  gross?: number;
  tax?: number;
  net?: number;
  rate?: number;
  ref?: string;
} | null {
  if (!memo) return null;
  try {
    const parsed = JSON.parse(memo);
    return {
      org: parsed.org,
      period: parsed.per,
      type: parsed.typ,
      gross: parsed.grs,
      tax: parsed.tax,
      net: parsed.net,
      rate: parsed.rat,
      ref: parsed.ref,
    };
  } catch {
    return null;
  }
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

export default function HistoryPage() {
  const [ufvk, setUfvk] = useState("");
  const [birthday, setBirthday] = useState("3860000");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ChainResponse | null>(null);

  const handleSync = async () => {
    if (!ufvk.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/payroll/view-from-chain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ufvk: ufvk.trim(), birthday: parseInt(birthday) || 3860000 }),
      });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sync");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-section-gap">
      <PageHeader
        title="Transaction History"
        description="Read directly from Zcash blockchain. Nothing is stored."
      />

      {/* UFVK Input */}
      <div className="bg-white border border-card-border rounded-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-4 h-4 text-green" />
          <h3 className="font-headline font-bold text-sm">Viewing Key</h3>
          <span className="text-xs text-muted ml-auto flex items-center gap-1">
            <Lock className="w-3 h-3" /> Read-only access. Cannot spend funds.
          </span>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-secondary block mb-1">Unified Full Viewing Key (UFVK)</label>
            <textarea
              value={ufvk}
              onChange={(e) => setUfvk(e.target.value)}
              placeholder="uviewtest1... or uview1..."
              rows={3}
              className="w-full border border-card-border rounded-lg px-3 py-2 text-sm font-mono resize-none focus:outline-none focus:ring-1 focus:ring-green"
            />
          </div>

          <div className="flex items-end gap-3">
            <div className="w-48">
              <label className="text-xs text-secondary block mb-1">Wallet Birthday Height</label>
              <input
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
                placeholder="3860000"
                className="w-full border border-card-border rounded-lg px-3 py-2 text-sm font-tabular focus:outline-none focus:ring-1 focus:ring-green"
              />
            </div>

            <button
              onClick={handleSync}
              disabled={loading || !ufvk.trim()}
              className="bg-green text-white text-sm font-medium px-6 py-2 rounded-btn hover:bg-green/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Syncing from chain...
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  View Transactions
                </>
              )}
            </button>
          </div>

          {loading && (
            <p className="text-xs text-muted">
              Syncing with Zcash network via lightwalletd. This may take 30-60 seconds.
            </p>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-card px-5 py-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Results */}
      {data && (
        <>
          {/* Balance */}
          <div className="bg-white border border-card-border rounded-card p-5">
            <p className="text-xs text-secondary">Wallet Balance (from chain)</p>
            <p className="text-2xl font-headline font-bold mt-1">{data.balance_zec.toFixed(8)} ZEC</p>
          </div>

          {/* Transactions */}
          <div className="bg-white border border-card-border rounded-card overflow-hidden">
            <div className="px-5 py-4 border-b border-card-border flex items-center justify-between">
              <h3 className="font-headline font-bold text-sm">
                {data.transactions.length} Transaction{data.transactions.length !== 1 ? "s" : ""}
              </h3>
              <Badge variant="green">From Zcash Chain</Badge>
            </div>

            {data.transactions.length === 0 ? (
              <div className="px-5 py-12 text-center text-secondary text-sm">
                No transactions found for this viewing key.
              </div>
            ) : (
              <div className="divide-y divide-card-border">
                {data.transactions.map((tx) => {
                  const stub = parseMemo(tx.memo);
                  return (
                    <div key={tx.tx_id} className="px-5 py-4">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          {stub ? (
                            <>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">{stub.org}</span>
                                <Badge variant="green">{stub.type || "Payment"}</Badge>
                              </div>
                              <p className="text-xs text-secondary mt-1">
                                {stub.period} {stub.ref ? `\u00b7 ${stub.ref}` : ""}
                              </p>
                              {stub.gross !== undefined && (
                                <div className="flex gap-4 mt-2 text-xs text-secondary">
                                  <span>Gross: ${stub.gross?.toFixed(2)}</span>
                                  <span>Tax: ${stub.tax?.toFixed(2)}</span>
                                  <span>Net: ${stub.net?.toFixed(2)}</span>
                                  <span>Rate: ${stub.rate?.toFixed(2)}/ZEC</span>
                                </div>
                              )}
                            </>
                          ) : (
                            <>
                              <span className="font-medium text-sm">Payment</span>
                              {tx.memo && (
                                <p className="text-xs text-secondary mt-1 truncate max-w-md">{tx.memo}</p>
                              )}
                            </>
                          )}
                          <p className="text-xs text-muted mt-2 font-mono">
                            {tx.tx_id.substring(0, 16)}... | Block {tx.block_height}
                          </p>
                        </div>
                        <div className="text-right ml-4 flex-shrink-0">
                          <p className="font-medium font-tabular text-sm">{tx.amount_zec.toFixed(8)} ZEC</p>
                          <Badge variant={tx.status === "confirmed" ? "green" : "amber"}>
                            {tx.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* Info footer */}
      {!data && !loading && (
        <div className="text-center py-12">
          <Shield className="w-8 h-8 text-muted mx-auto mb-3" />
          <p className="text-sm text-secondary">
            Enter your Unified Full Viewing Key to view transactions directly from the Zcash blockchain.
          </p>
          <p className="text-xs text-muted mt-2">
            Derive your UFVK from your seed phrase: <code className="bg-table-header px-1.5 py-0.5 rounded text-xs">cargo run --bin derive-ufvk</code>
          </p>
        </div>
      )}
    </div>
  );
}
