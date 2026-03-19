"use client";

import { useState, useRef } from "react";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/badge";
import { Modal } from "@/components/modal";
import { FormInput } from "@/components/form-input";
import { useApi, useApiPost, useApiPut, useApiDelete, useAuthenticatedDownload } from "@/lib/use-api";
import type { ContributorsResponse, Contributor } from "@/lib/api";
import { Pencil, Send, Upload, Download, AlertCircle, CheckCircle2, Trash2, Loader2 } from "lucide-react";

interface CsvRow {
  full_name: string;
  email: string;
  department: string;
  monthly_rate_usd: number;
  wallet_address: string;
  employment_type: string;
  tax_jurisdiction: string;
  _valid: boolean;
  _errors: string[];
}

interface BulkResult {
  created_count: number;
  skipped_count: number;
  error_count: number;
  created: { id: string; name: string; email: string }[];
  skipped: { email: string; reason: string }[];
  errors: { email: string; reason: string }[];
}

function parseCsv(text: string): CsvRow[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());

  const nameIdx = headers.findIndex((h) => h === "name" || h === "full_name");
  const emailIdx = headers.indexOf("email");
  const deptIdx = headers.findIndex((h) => h === "department" || h === "dept");
  const rateIdx = headers.findIndex((h) => h.includes("rate") || h.includes("salary"));
  const walletIdx = headers.findIndex((h) => h.includes("wallet") || h.includes("address"));
  const typeIdx = headers.findIndex((h) => h.includes("employment") || h.includes("type"));
  const taxIdx = headers.findIndex((h) => h.includes("tax") || h.includes("jurisdiction"));

  return lines.slice(1).filter((l) => l.trim()).map((line) => {
    const cols = line.split(",").map((c) => c.trim());
    const errors: string[] = [];
    const name = cols[nameIdx] || "";
    const email = cols[emailIdx] || "";
    const dept = cols[deptIdx] || "";
    const rate = parseFloat(cols[rateIdx] || "0");
    if (!name) errors.push("Missing name");
    if (!email) errors.push("Missing email");
    if (!dept) errors.push("Missing department");
    if (!rate || isNaN(rate)) errors.push("Invalid rate");

    return {
      full_name: name,
      email,
      department: dept,
      monthly_rate_usd: isNaN(rate) ? 0 : rate,
      wallet_address: cols[walletIdx] || "",
      employment_type: cols[typeIdx] || "employee",
      tax_jurisdiction: cols[taxIdx] || "US",
      _valid: errors.length === 0,
      _errors: errors,
    };
  });
}

const departmentColors: Record<string, string> = {
  Engineering: "bg-blue-500",
  Design: "bg-purple-500",
  Marketing: "bg-orange-500",
  Operations: "bg-teal-500",
};

const emptyForm = {
  fullName: "",
  email: "",
  department: "",
  monthlyRate: "",
  walletAddress: "",
  paymentPreference: "zec" as "zec" | "usdc",
  destinationChain: "solana" as string,
  destinationAddress: "",
};

export default function ContributorsPage() {
  const [filter, setFilter] = useState("All");
  const { data, loading, refetch } = useApi<ContributorsResponse>(`/api/contributors?department=${filter === "All" ? "all" : filter}`);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingContributor, setEditingContributor] = useState<Contributor | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");

  const { post, loading: posting } = useApiPost<Record<string, unknown>, Contributor>();
  const { put, loading: putting } = useApiPut<Record<string, unknown>, Contributor>();
  const { post: postVerify } = useApiPost<Record<string, unknown>, { status: string }>();
  const { post: postBulk, loading: bulkPosting } = useApiPost<Record<string, unknown>, BulkResult>();
  const { del } = useApiDelete<{ status: string }>();
  const { download } = useAuthenticatedDownload();
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (!data) return;
    if (selected.size === data.contributors.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(data.contributors.map((c) => c.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} contributor${selected.size > 1 ? "s" : ""}? This cannot be undone.`)) return;
    setBulkDeleting(true);
    setActionError(null);
    try {
      await Promise.all(Array.from(selected).map((id) => del(`/api/contributors/${id}`)));
      setSelected(new Set());
      refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Some contributors could not be deleted.");
      refetch();
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleDelete = async (contributorId: string, name: string) => {
    if (!confirm(`Delete ${name}? This cannot be undone.`)) return;
    setDeletingId(contributorId);
    setActionError(null);
    try {
      await del(`/api/contributors/${contributorId}`);
      setSelected((prev) => { const next = new Set(prev); next.delete(contributorId); return next; });
      refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : `Failed to delete ${name}.`);
    } finally {
      setDeletingId(null);
    }
  };

  // CSV upload state
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvRows, setCsvRows] = useState<CsvRow[]>([]);
  const [csvFileName, setCsvFileName] = useState("");
  const [bulkResult, setBulkResult] = useState<BulkResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFileName(file.name);
    setBulkResult(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const rows = parseCsv(text);
      setCsvRows(rows);
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleBulkImport = async () => {
    const validRows = csvRows.filter((r) => r._valid);
    if (validRows.length === 0) return;
    try {
      const result = await postBulk("/api/contributors/bulk", {
        contributors: validRows.map((r) => ({
          full_name: r.full_name,
          email: r.email,
          department: r.department,
          monthly_rate_usd: r.monthly_rate_usd,
          wallet_address: r.wallet_address || null,
          employment_type: r.employment_type,
          tax_jurisdiction: r.tax_jurisdiction,
        })),
      });
      setBulkResult(result);
      refetch();
    } catch (err) {
      setBulkResult({
        created_count: 0, skipped_count: 0, error_count: 1,
        created: [], skipped: [],
        errors: [{ email: "", reason: err instanceof Error ? err.message : "Import failed" }],
      });
    }
  };

  const handleDownloadTemplate = () => {
    download("/api/contributors/csv-template", "contributors_template.csv");
  };

  const openCsvModal = () => {
    setCsvRows([]);
    setCsvFileName("");
    setBulkResult(null);
    setShowCsvModal(true);
  };

  const handleVerify = async (contributorId: string) => {
    setVerifyingId(contributorId);
    setActionError(null);
    try {
      await postVerify(`/api/contributors/${contributorId}/verify`, {});
      refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to send test transaction.");
    } finally {
      setVerifyingId(null);
    }
  };

  const openAddModal = () => {
    setForm(emptyForm);
    setFormError("");
    setShowAddModal(true);
  };

  const openEditModal = (c: Contributor) => {
    setEditingContributor(c);
    setForm({
      fullName: c.full_name,
      email: c.email,
      department: c.department,
      monthlyRate: String(c.monthly_rate_usd),
      walletAddress: "",
      paymentPreference: c.payment_preference || "zec",
      destinationChain: c.destination_chain || "solana",
      destinationAddress: "",
    });
    setFormError("");
  };

  const updateField = (field: keyof typeof form) => (value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAdd = async () => {
    if (!form.fullName || !form.email || !form.department || !form.monthlyRate) {
      setFormError("Name, email, department, and rate are required.");
      return;
    }
    if (form.paymentPreference === "zec" && !form.walletAddress) {
      setFormError("Zcash wallet address is required for ZEC payments.");
      return;
    }
    if (form.paymentPreference === "usdc" && !form.destinationAddress) {
      setFormError("Destination wallet address is required for USDC payments.");
      return;
    }
    try {
      const body: Record<string, unknown> = {
        full_name: form.fullName,
        email: form.email,
        department: form.department,
        monthly_rate_usd: Number(form.monthlyRate),
        employment_type: "employee",
        tax_jurisdiction: "US",
        payment_preference: form.paymentPreference,
      };
      if (form.paymentPreference === "zec") {
        body.wallet_address = form.walletAddress;
      } else {
        body.destination_chain = form.destinationChain;
        body.destination_address = form.destinationAddress;
        if (form.walletAddress) body.wallet_address = form.walletAddress;
      }
      await post("/api/contributors", body);
      setShowAddModal(false);
      refetch();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to add contributor.");
    }
  };

  const handleEdit = async () => {
    if (!editingContributor) return;
    try {
      const body: Record<string, unknown> = {};
      if (form.fullName !== editingContributor.full_name) body.full_name = form.fullName;
      if (form.email !== editingContributor.email) body.email = form.email;
      if (form.department !== editingContributor.department) body.department = form.department;
      if (Number(form.monthlyRate) !== editingContributor.monthly_rate_usd) body.monthly_rate_usd = Number(form.monthlyRate);
      if (form.walletAddress) body.wallet_address = form.walletAddress;
      if (form.paymentPreference !== editingContributor.payment_preference) body.payment_preference = form.paymentPreference;
      if (form.paymentPreference === "usdc") {
        if (form.destinationChain !== (editingContributor.destination_chain || "solana")) body.destination_chain = form.destinationChain;
        if (form.destinationAddress) body.destination_address = form.destinationAddress;
      }

      if (Object.keys(body).length === 0) {
        setEditingContributor(null);
        return;
      }

      await put(`/api/contributors/${editingContributor.id}`, body);
      setEditingContributor(null);
      refetch();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to update contributor.");
    }
  };

  if (loading || !data) {
    return (
      <div className="space-y-section-gap animate-pulse">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-7 w-36 bg-gray-200 rounded" />
            <div className="h-4 w-28 bg-gray-100 rounded mt-2" />
          </div>
          <div className="flex gap-3">
            <div className="h-10 w-28 bg-gray-100 rounded-btn" />
            <div className="h-10 w-36 bg-gray-200 rounded-btn" />
          </div>
        </div>
        <div className="flex gap-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-8 w-24 bg-gray-100 rounded-badge" />
          ))}
        </div>
        <div className="bg-white border border-card-border rounded-card overflow-hidden">
          <div className="bg-table-header border-b border-card-border px-6 py-3">
            <div className="h-3 w-full bg-gray-100 rounded" />
          </div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-6 px-6 py-4 border-b border-row-border last:border-0">
              <div className="w-8 h-8 rounded-full bg-gray-200" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-gray-200 rounded" />
                <div className="h-3 w-40 bg-gray-100 rounded" />
              </div>
              <div className="h-4 w-20 bg-gray-100 rounded" />
              <div className="h-4 w-24 bg-gray-100 rounded" />
              <div className="h-5 w-16 bg-gray-100 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const departments = ["All", ...data.departments.map((d) => d.name)];
  const contributors = data.contributors;
  const isEditing = !!editingContributor;

  return (
    <div className="space-y-section-gap">
      <PageHeader
        title="Contributors"
        description={`${data.total} team members`}
        action={
          <div className="flex items-center gap-3">
            {selected.size > 0 && (
              <button
                onClick={handleBulkDelete}
                disabled={bulkDeleting}
                className="flex items-center gap-2 bg-red-500 text-white text-sm font-medium px-5 py-2.5 rounded-btn hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {bulkDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {bulkDeleting ? "Deleting..." : `Delete ${selected.size}`}
              </button>
            )}
            <button
              onClick={openCsvModal}
              className="flex items-center gap-2 border border-card-border text-primary text-sm font-medium px-5 py-2.5 rounded-btn hover:bg-gray-50 transition-colors"
            >
              <Upload className="w-4 h-4" />
              Upload CSV
            </button>
            <button
              onClick={openAddModal}
              className="bg-green text-white text-sm font-medium px-5 py-2.5 rounded-btn hover:bg-green/90 transition-colors"
            >
              Add Contributor
            </button>
          </div>
        }
      />

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

      {actionError && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-card px-5 py-3">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700 flex-1">{actionError}</p>
          <button onClick={() => setActionError(null)} className="text-red-400 hover:text-red-600 text-xs font-medium">Dismiss</button>
        </div>
      )}

      <div className="bg-white border border-card-border rounded-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-table-header border-b border-card-border">
              <th className="px-4 py-3 w-10">
                <input
                  type="checkbox"
                  checked={contributors.length > 0 && selected.size === contributors.length}
                  onChange={toggleSelectAll}
                  className="rounded border-gray-300"
                />
              </th>
              <th className="text-left text-xs font-medium text-secondary uppercase tracking-wider px-6 py-3">Contributor</th>
              <th className="text-left text-xs font-medium text-secondary uppercase tracking-wider px-6 py-3">Department</th>
              <th className="text-left text-xs font-medium text-secondary uppercase tracking-wider px-6 py-3">Payment</th>
              <th className="text-left text-xs font-medium text-secondary uppercase tracking-wider px-6 py-3">Wallet</th>
              <th className="text-left text-xs font-medium text-secondary uppercase tracking-wider px-6 py-3">Monthly Rate</th>
              <th className="text-left text-xs font-medium text-secondary uppercase tracking-wider px-6 py-3">Status</th>
              <th className="text-left text-xs font-medium text-secondary uppercase tracking-wider px-6 py-3">Verification</th>
              <th className="text-left text-xs font-medium text-secondary uppercase tracking-wider px-6 py-3 w-24">Actions</th>
            </tr>
          </thead>
          <tbody>
            {contributors.map((c) => (
              <tr key={c.id} className={`border-b border-row-border last:border-0 hover:bg-gray-50/50 transition-colors ${selected.has(c.id) ? "bg-green/5" : ""}`}>
                <td className="px-4 py-4 w-10">
                  <input
                    type="checkbox"
                    checked={selected.has(c.id)}
                    onChange={() => toggleSelect(c.id)}
                    className="rounded border-gray-300"
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full ${departmentColors[c.department] || "bg-gray-400"} flex items-center justify-center`}>
                      <span className="text-white text-xs font-medium">{c.full_name.split(" ").map(n => n[0]).join("")}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{c.full_name}</p>
                      <p className="text-xs text-muted">{c.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-secondary">{c.department}</td>
                <td className="px-6 py-4">
                  <Badge variant={c.payment_preference === "usdc" ? "blue" : "green"}>
                    {c.payment_preference === "usdc" ? `USDC (${c.destination_chain || "?"})` : "ZEC"}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-sm text-muted font-mono text-xs">
                  {c.payment_preference === "usdc" ? c.destination_address_masked || "" : c.wallet_address_masked}
                </td>
                <td className="px-6 py-4 text-sm font-tabular font-medium">${c.monthly_rate_usd.toLocaleString()}</td>
                <td className="px-6 py-4">
                  <Badge variant={c.status === "active" ? "green" : "amber"}>{c.status}</Badge>
                </td>
                <td className="px-6 py-4">
                  <Badge variant={c.verification_status === "verified" ? "green" : c.verification_status === "test_sent" ? "amber" : "gray"}>
                    {c.verification_status === "test_sent" ? "pending" : c.verification_status}
                  </Badge>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {c.verification_status !== "verified" && c.wallet_address_masked && (
                      <button
                        onClick={() => handleVerify(c.id)}
                        disabled={verifyingId === c.id || c.verification_status === "test_sent"}
                        className="text-green hover:text-green/80 transition-colors disabled:opacity-50"
                        title="Send test transaction"
                      >
                        {verifyingId === c.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      </button>
                    )}
                    <button
                      onClick={() => openEditModal(c)}
                      className="text-muted hover:text-primary transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(c.id, c.full_name)}
                      disabled={deletingId === c.id}
                      className="text-muted hover:text-error transition-colors disabled:opacity-50"
                      title="Delete contributor"
                    >
                      {deletingId === c.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Contributor Modal */}
      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Add Contributor">
        <div className="space-y-4">
          <FormInput label="Full Name" value={form.fullName} onChange={updateField("fullName")} placeholder="Jane Smith" />
          <FormInput label="Email" value={form.email} onChange={updateField("email")} type="email" placeholder="jane@company.com" />
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="Department" value={form.department} onChange={updateField("department")} placeholder="Engineering" />
            <FormInput label="Monthly Rate (USD)" value={form.monthlyRate} onChange={updateField("monthlyRate")} type="number" placeholder="5000" />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary mb-1">Payment Preference</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, paymentPreference: "zec" }))}
                className={`flex-1 py-2 px-4 rounded-btn text-sm font-medium border transition-colors ${
                  form.paymentPreference === "zec"
                    ? "bg-green text-white border-green"
                    : "bg-white text-secondary border-card-border hover:bg-gray-50"
                }`}
              >
                ZEC
              </button>
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, paymentPreference: "usdc" }))}
                className={`flex-1 py-2 px-4 rounded-btn text-sm font-medium border transition-colors ${
                  form.paymentPreference === "usdc"
                    ? "bg-blue-500 text-white border-blue-500"
                    : "bg-white text-secondary border-card-border hover:bg-gray-50"
                }`}
              >
                USDC
              </button>
            </div>
          </div>
          {form.paymentPreference === "zec" ? (
            <FormInput label="Zcash Wallet Address" value={form.walletAddress} onChange={updateField("walletAddress")} placeholder="zs1..." />
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-primary mb-1">Destination Chain</label>
                <select
                  value={form.destinationChain}
                  onChange={(e) => setForm((prev) => ({ ...prev, destinationChain: e.target.value }))}
                  className="w-full border border-card-border rounded-btn px-4 py-2.5 text-sm bg-white"
                >
                  <option value="solana">Solana</option>
                  <option value="ethereum">Ethereum</option>
                  <option value="base">Base</option>
                  <option value="arbitrum">Arbitrum</option>
                </select>
              </div>
              <FormInput
                label="Destination Wallet Address"
                value={form.destinationAddress}
                onChange={updateField("destinationAddress")}
                placeholder={form.destinationChain === "solana" ? "Enter Solana address..." : "0x..."}
              />
              <FormInput label="Zcash Wallet Address (optional)" value={form.walletAddress} onChange={updateField("walletAddress")} placeholder="zs1..." />
            </>
          )}
          {formError && <p className="text-sm text-error">{formError}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowAddModal(false)} className="border border-card-border text-primary text-sm font-medium px-5 py-2.5 rounded-btn hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button onClick={handleAdd} disabled={posting} className="bg-green text-white text-sm font-medium px-5 py-2.5 rounded-btn hover:bg-green/90 transition-colors disabled:opacity-50 flex items-center gap-2">
              {posting && <Loader2 className="w-4 h-4 animate-spin" />}
              {posting ? "Adding..." : "Add Contributor"}
            </button>
          </div>
        </div>
      </Modal>

      {/* CSV Upload Modal */}
      <Modal open={showCsvModal} onClose={() => setShowCsvModal(false)} title="Import Contributors from CSV">
        <div className="space-y-4">
          {!bulkResult ? (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-secondary">Upload a CSV file with contributor data.</p>
                <button
                  onClick={handleDownloadTemplate}
                  className="flex items-center gap-1.5 text-sm text-green hover:text-green/80 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Template
                </button>
              </div>

              <input type="file" ref={fileInputRef} accept=".csv" onChange={handleFileSelect} className="hidden" />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-card-border rounded-card py-8 flex flex-col items-center gap-2 hover:border-green/50 hover:bg-green/5 transition-colors"
              >
                <Upload className="w-6 h-6 text-muted" />
                <span className="text-sm text-secondary">{csvFileName || "Click to select a CSV file"}</span>
              </button>

              {csvRows.length > 0 && (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-secondary">
                      {csvRows.filter((r) => r._valid).length} valid of {csvRows.length} rows
                    </span>
                    {csvRows.some((r) => !r._valid) && (
                      <span className="flex items-center gap-1 text-error">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {csvRows.filter((r) => !r._valid).length} with errors
                      </span>
                    )}
                  </div>

                  <div className="max-h-64 overflow-auto border border-card-border rounded-card">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-table-header border-b border-card-border">
                          <th className="text-left px-3 py-2 text-xs font-medium text-secondary">Name</th>
                          <th className="text-left px-3 py-2 text-xs font-medium text-secondary">Email</th>
                          <th className="text-left px-3 py-2 text-xs font-medium text-secondary">Dept</th>
                          <th className="text-right px-3 py-2 text-xs font-medium text-secondary">Rate</th>
                          <th className="text-left px-3 py-2 text-xs font-medium text-secondary">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {csvRows.map((row, i) => (
                          <tr key={i} className={`border-b border-row-border last:border-0 ${!row._valid ? "bg-red-50" : ""}`}>
                            <td className="px-3 py-2">{row.full_name || <span className="text-error italic">missing</span>}</td>
                            <td className="px-3 py-2 text-muted">{row.email || <span className="text-error italic">missing</span>}</td>
                            <td className="px-3 py-2">{row.department || <span className="text-error italic">missing</span>}</td>
                            <td className="px-3 py-2 text-right font-tabular">{row.monthly_rate_usd ? `$${row.monthly_rate_usd.toLocaleString()}` : <span className="text-error italic">invalid</span>}</td>
                            <td className="px-3 py-2">
                              {row._valid ? (
                                <CheckCircle2 className="w-4 h-4 text-green" />
                              ) : (
                                <span className="text-xs text-error">{row._errors.join(", ")}</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button onClick={() => setShowCsvModal(false)} className="border border-card-border text-primary text-sm font-medium px-5 py-2.5 rounded-btn hover:bg-gray-50 transition-colors">
                      Cancel
                    </button>
                    <button
                      onClick={handleBulkImport}
                      disabled={bulkPosting || csvRows.filter((r) => r._valid).length === 0}
                      className="bg-green text-white text-sm font-medium px-5 py-2.5 rounded-btn hover:bg-green/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {bulkPosting && <Loader2 className="w-4 h-4 animate-spin" />}
                      {bulkPosting ? "Importing..." : `Import ${csvRows.filter((r) => r._valid).length} Contributors`}
                    </button>
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-card bg-green/10 border border-green/20">
                <CheckCircle2 className="w-5 h-5 text-green flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">{bulkResult.created_count} contributor{bulkResult.created_count !== 1 ? "s" : ""} imported</p>
                  {bulkResult.skipped_count > 0 && (
                    <p className="text-xs text-secondary mt-0.5">{bulkResult.skipped_count} skipped (already exist)</p>
                  )}
                  {bulkResult.error_count > 0 && (
                    <p className="text-xs text-error mt-0.5">{bulkResult.error_count} failed</p>
                  )}
                </div>
              </div>

              {bulkResult.skipped.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-secondary mb-1">Skipped:</p>
                  <div className="space-y-1">
                    {bulkResult.skipped.map((s, i) => (
                      <p key={i} className="text-xs text-muted">{s.email}: {s.reason}</p>
                    ))}
                  </div>
                </div>
              )}

              {bulkResult.errors.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-error mb-1">Errors:</p>
                  <div className="space-y-1">
                    {bulkResult.errors.map((e, i) => (
                      <p key={i} className="text-xs text-error">{e.email}: {e.reason}</p>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button onClick={() => setShowCsvModal(false)} className="bg-green text-white text-sm font-medium px-5 py-2.5 rounded-btn hover:bg-green/90 transition-colors">
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Edit Contributor Modal */}
      <Modal open={isEditing} onClose={() => setEditingContributor(null)} title="Edit Contributor">
        <div className="space-y-4">
          <FormInput label="Full Name" value={form.fullName} onChange={updateField("fullName")} />
          <FormInput label="Email" value={form.email} onChange={updateField("email")} type="email" />
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="Department" value={form.department} onChange={updateField("department")} />
            <FormInput label="Monthly Rate (USD)" value={form.monthlyRate} onChange={updateField("monthlyRate")} type="number" />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary mb-1">Payment Preference</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, paymentPreference: "zec" }))}
                className={`flex-1 py-2 px-4 rounded-btn text-sm font-medium border transition-colors ${
                  form.paymentPreference === "zec"
                    ? "bg-green text-white border-green"
                    : "bg-white text-secondary border-card-border hover:bg-gray-50"
                }`}
              >
                ZEC
              </button>
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, paymentPreference: "usdc" }))}
                className={`flex-1 py-2 px-4 rounded-btn text-sm font-medium border transition-colors ${
                  form.paymentPreference === "usdc"
                    ? "bg-blue-500 text-white border-blue-500"
                    : "bg-white text-secondary border-card-border hover:bg-gray-50"
                }`}
              >
                USDC
              </button>
            </div>
          </div>
          {form.paymentPreference === "zec" ? (
            <FormInput label="Zcash Wallet Address (leave blank to keep current)" value={form.walletAddress} onChange={updateField("walletAddress")} placeholder="zs1..." />
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-primary mb-1">Destination Chain</label>
                <select
                  value={form.destinationChain}
                  onChange={(e) => setForm((prev) => ({ ...prev, destinationChain: e.target.value }))}
                  className="w-full border border-card-border rounded-btn px-4 py-2.5 text-sm bg-white"
                >
                  <option value="solana">Solana</option>
                  <option value="ethereum">Ethereum</option>
                  <option value="base">Base</option>
                  <option value="arbitrum">Arbitrum</option>
                </select>
              </div>
              <FormInput
                label="Destination Wallet Address (leave blank to keep current)"
                value={form.destinationAddress}
                onChange={updateField("destinationAddress")}
                placeholder={form.destinationChain === "solana" ? "Enter Solana address..." : "0x..."}
              />
              <FormInput label="Zcash Wallet Address (leave blank to keep current)" value={form.walletAddress} onChange={updateField("walletAddress")} placeholder="zs1..." />
            </>
          )}
          {formError && <p className="text-sm text-error">{formError}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setEditingContributor(null)} className="border border-card-border text-primary text-sm font-medium px-5 py-2.5 rounded-btn hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button onClick={handleEdit} disabled={putting} className="bg-green text-white text-sm font-medium px-5 py-2.5 rounded-btn hover:bg-green/90 transition-colors disabled:opacity-50 flex items-center gap-2">
              {putting && <Loader2 className="w-4 h-4 animate-spin" />}
              {putting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
