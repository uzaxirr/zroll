"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/badge";
import { Eye, Loader2, Shield, Lock, RefreshCw, ChevronDown, ChevronRight, Users, ArrowUpDown, ExternalLink, Info, Copy, Check, Play, X, Download } from "lucide-react";

interface PayStub {
  org: string | null;
  period: string | null;
  type: string | null;
  gross_usd: number | null;
  tax_usd: number | null;
  net_usd: number | null;
  zec_rate: number | null;
  reference: string | null;
}

interface ChainTransaction {
  tx_id: string;
  block_height: number;
  amount_zec: number;
  memo: string | null;
  status: string;
  is_payroll: boolean;
  contributor: { name: string; department: string } | null;
  pay_stub: PayStub | null;
}

interface ContributorSummary {
  name: string;
  department: string;
  wallet_masked: string | null;
}

interface ChainResponse {
  balance_zec: number;
  transactions: ChainTransaction[];
  contributors: ContributorSummary[];
  _cached?: boolean;
  _cache_age_s?: number;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

const DEMO_UFVK = "uviewtest15gj34du0xyrnv43vrz2p9pasnc7scfx2ftn34mwu8v6wkvtsl60n6j3c22jn76fm34sguxsl84dhugh7gtn3665vzzzt30ja0ne2q8ecs6z6kjhjfcfa8d730dq0ad43tandwvtclaf0yng0e0zf66wl0xs9u4r5v24fj2st8ncysyv79u0w2dyfv2nupf4yu48j7xj9ftvxanh6m56rajjr84drpwzvcjjkz3f8fpmzpl03sqdm5ru3s502wkrnlztz9qsf8x9paw33exfvanzxe6kn86kgxp9g8rx2x74yz2at8pnpgyvx0gdavf205lgk7jzaa3jxg04stylhkyng6n2yj0revnfq5yurzlxuz9v7jrnnt0eyummkyyrnxsqc6a868vaznvuarx9v62e9l4wpjty4rsawar890dvcdekwdg0v7e039ykdhr3p9phldtn4l7rrxtcf2ru30ldtzr83nkpgdepn936pxhzt2x9sggpsvxzv";
const DEMO_BIRTHDAY = "3860000";

function PayrollTxRow({ tx }: { tx: ChainTransaction }) {
  const stub = tx.pay_stub;
  return (
    <div className="px-5 py-4">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {tx.contributor ? (
              <span className="font-medium text-sm">{tx.contributor.name}</span>
            ) : (
              <span className="font-medium text-sm">{stub?.org || "Payroll"}</span>
            )}
            <Badge variant="green">{stub?.type || "Payment"}</Badge>
            {tx.contributor?.department && (
              <span className="text-xs text-muted">{tx.contributor.department}</span>
            )}
          </div>
          {stub && (
            <p className="text-xs text-secondary mt-1">
              {stub.period} {stub.reference ? `\u00b7 ${stub.reference}` : ""}
            </p>
          )}
          {stub?.gross_usd != null && (
            <div className="flex gap-4 mt-2 text-xs text-secondary">
              <span>Gross: ${stub.gross_usd?.toFixed(2)}</span>
              <span>Tax: ${stub.tax_usd?.toFixed(2)}</span>
              <span>Net: ${stub.net_usd?.toFixed(2)}</span>
              <span>Rate: ${stub.zec_rate?.toFixed(2)}/ZEC</span>
            </div>
          )}
          <p className="text-xs text-muted mt-2 font-mono flex items-center gap-1">
            <a
              href={`https://testnet.cipherscan.app/tx/${tx.tx_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-green transition-colors flex items-center gap-1"
            >
              {tx.tx_id.substring(0, 16)}...
              <ExternalLink className="w-3 h-3" />
            </a>
            <span>| Block {tx.block_height}</span>
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
}

function OtherTxRow({ tx }: { tx: ChainTransaction }) {
  return (
    <div className="px-5 py-3">
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm text-secondary">Transfer</span>
            {tx.memo && (
              <span className="text-xs text-muted truncate max-w-xs">{tx.memo.substring(0, 50)}{tx.memo.length > 50 ? "..." : ""}</span>
            )}
          </div>
          <p className="text-xs text-muted mt-1 font-mono flex items-center gap-1">
            <a
              href={`https://testnet.cipherscan.app/tx/${tx.tx_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-green transition-colors flex items-center gap-1"
            >
              {tx.tx_id.substring(0, 16)}...
              <ExternalLink className="w-3 h-3" />
            </a>
            <span>| Block {tx.block_height}</span>
          </p>
        </div>
        <div className="text-right ml-4 flex-shrink-0">
          <p className="font-tabular text-sm text-secondary">{tx.amount_zec.toFixed(8)} ZEC</p>
          <Badge variant={tx.status === "confirmed" ? "green" : "amber"}>
            {tx.status}
          </Badge>
        </div>
      </div>
    </div>
  );
}

export default function HistoryPage() {
  const [ufvk, setUfvk] = useState("");
  const [birthday, setBirthday] = useState("3860000");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ChainResponse | null>(null);
  const [showOther, setShowOther] = useState(false);
  const [showDemo, setShowDemo] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleCopyKey = async () => {
    await navigator.clipboard.writeText(DEMO_UFVK);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLoadDemo = () => {
    setUfvk(DEMO_UFVK);
    setBirthday(DEMO_BIRTHDAY);
    setShowDemo(false);
  };

  const handleSync = async (forceRefresh = false) => {
    const trimmed = ufvk.trim();
    if (!trimmed) return;
    if (!trimmed.startsWith("uview") && !trimmed.startsWith("uviewtest")) {
      setError("Invalid viewing key. Must start with 'uview' (mainnet) or 'uviewtest' (testnet).");
      return;
    }
    if (trimmed.length < 100) {
      setError("Viewing key appears too short. Please paste the full unified viewing key.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const url = new URL(`${API_BASE}/api/payroll/view-from-chain`);
      if (forceRefresh) url.searchParams.set("force_refresh", "true");
      const res = await fetch(url.toString(), {
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

  const handleExportCsv = () => {
    if (!data) return;
    const rows = [["TX ID", "Block", "Amount ZEC", "Type", "Contributor", "Department", "Period", "Status"]];
    for (const tx of data.transactions) {
      rows.push([
        tx.tx_id,
        String(tx.block_height),
        tx.amount_zec.toFixed(8),
        tx.is_payroll ? "Payroll" : "Transfer",
        tx.contributor?.name || "",
        tx.contributor?.department || "",
        tx.pay_stub?.period || "",
        tx.status,
      ]);
    }
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "zwage_transactions.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const payrollTxs = data?.transactions.filter((tx) => tx.is_payroll) || [];
  const otherTxs = data?.transactions.filter((tx) => !tx.is_payroll) || [];

  return (
    <div className="space-y-section-gap">
      <PageHeader
        title="Transaction History"
        description="Read directly from Zcash blockchain. Nothing is stored."
      />

      {/* Demo Banner */}
      {showDemo && !data && (
        <div className="bg-green/5 border border-green/20 rounded-card p-4 relative">
          <button
            onClick={() => setShowDemo(false)}
            className="absolute top-3 right-3 text-muted hover:text-secondary transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <div className="flex items-start gap-3">
            <Info className="w-4 h-4 text-green mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-primary">Try it with our testnet viewing key</p>
              <p className="text-xs text-secondary mt-1">
                This read-only key lets you view real payroll transactions on Zcash testnet. No funds can be spent.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <code className="text-xs font-mono bg-white border border-card-border rounded px-2 py-1.5 truncate block max-w-md">
                  {DEMO_UFVK.substring(0, 48)}...
                </code>
                <button
                  onClick={handleCopyKey}
                  className="flex items-center gap-1 text-xs border border-card-border rounded-btn px-3 py-1.5 hover:bg-white transition-colors flex-shrink-0"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-green" />
                      <span className="text-green">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      Copy Key
                    </>
                  )}
                </button>
                <button
                  onClick={handleLoadDemo}
                  className="flex items-center gap-1 text-xs bg-green text-white rounded-btn px-3 py-1.5 hover:bg-green/90 transition-colors flex-shrink-0"
                >
                  <Play className="w-3 h-3" />
                  Load and Try
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
              onClick={() => handleSync()}
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
          {/* Balance + Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-white border border-card-border rounded-card p-5 lg:col-span-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-secondary">Wallet Balance (from chain)</p>
                  <p className="text-2xl font-headline font-bold mt-1">{data.balance_zec.toFixed(8)} ZEC</p>
                </div>
                <div className="flex items-center gap-3">
                  {data._cached && (
                    <span className="text-xs text-muted">
                      Cached {data._cache_age_s}s ago
                    </span>
                  )}
                  <button
                    onClick={() => handleSync(true)}
                    disabled={loading}
                    className="text-xs text-secondary hover:text-primary flex items-center gap-1 border border-card-border rounded-btn px-3 py-1.5 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                    {loading ? "Syncing..." : "Refresh"}
                  </button>
                </div>
              </div>
            </div>
            <div className="bg-white border border-card-border rounded-card p-5">
              <p className="text-xs text-secondary">Transactions</p>
              <p className="text-2xl font-headline font-bold mt-1">{data.transactions.length}</p>
              <div className="flex gap-3 mt-2 text-xs">
                <span className="text-green">{payrollTxs.length} payroll</span>
                <span className="text-muted">{otherTxs.length} other</span>
              </div>
            </div>
          </div>

          {/* Payroll Transactions */}
          <div className="bg-white border border-card-border rounded-card overflow-hidden">
            <div className="px-5 py-4 border-b border-card-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-green" />
                <h3 className="font-headline font-bold text-sm">
                  Payroll Transactions ({payrollTxs.length})
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportCsv}
                  className="text-xs text-secondary hover:text-primary flex items-center gap-1 border border-card-border rounded-btn px-3 py-1.5 hover:bg-gray-50 transition-colors"
                >
                  <Download className="w-3 h-3" />
                  Export CSV
                </button>
                <Badge variant="green">From Zcash Chain</Badge>
              </div>
            </div>

            {payrollTxs.length === 0 ? (
              <div className="px-5 py-8 text-center text-secondary text-sm">
                No payroll transactions found. Transactions with pay stub memos will appear here.
              </div>
            ) : (
              <div className="divide-y divide-card-border">
                {payrollTxs.map((tx) => (
                  <PayrollTxRow key={tx.tx_id} tx={tx} />
                ))}
              </div>
            )}
          </div>

          {/* Other Transactions (collapsed by default) */}
          {otherTxs.length > 0 && (
            <div className="bg-white border border-card-border rounded-card overflow-hidden">
              <button
                onClick={() => setShowOther(!showOther)}
                className="w-full px-5 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="w-4 h-4 text-muted" />
                  <span className="text-sm text-secondary">
                    Other Transactions ({otherTxs.length})
                  </span>
                  <span className="text-xs text-muted">Non-payroll transfers</span>
                </div>
                {showOther ? (
                  <ChevronDown className="w-4 h-4 text-muted" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted" />
                )}
              </button>

              {showOther && (
                <div className="divide-y divide-card-border border-t border-card-border">
                  {otherTxs.map((tx) => (
                    <OtherTxRow key={tx.tx_id} tx={tx} />
                  ))}
                </div>
              )}
            </div>
          )}
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
