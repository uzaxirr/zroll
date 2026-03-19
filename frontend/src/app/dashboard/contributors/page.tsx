"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/badge";
import { Modal } from "@/components/modal";
import { FormInput } from "@/components/form-input";
import { useApi, useApiPost, useApiPut } from "@/lib/use-api";
import type { ContributorsResponse, Contributor } from "@/lib/api";
import { Pencil, Send } from "lucide-react";

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
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  const handleVerify = async (contributorId: string) => {
    setVerifyingId(contributorId);
    try {
      await postVerify(`/api/contributors/${contributorId}/verify`, {});
      refetch();
    } catch {
      // silently fail - status will update on next refetch
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
    return <div className="flex items-center justify-center h-64"><p className="text-secondary text-sm">Loading contributors...</p></div>;
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
          <button
            onClick={openAddModal}
            className="bg-green text-white text-sm font-medium px-5 py-2.5 rounded-btn hover:bg-green/90 transition-colors"
          >
            Add Contributor
          </button>
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

      <div className="bg-white border border-card-border rounded-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-table-header border-b border-card-border">
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
              <tr key={c.id} className="border-b border-row-border last:border-0 hover:bg-gray-50/50 transition-colors">
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
                        <Send className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => openEditModal(c)}
                      className="text-muted hover:text-primary transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
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
            <button onClick={handleAdd} disabled={posting} className="bg-green text-white text-sm font-medium px-5 py-2.5 rounded-btn hover:bg-green/90 transition-colors disabled:opacity-50">
              {posting ? "Adding..." : "Add Contributor"}
            </button>
          </div>
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
            <button onClick={handleEdit} disabled={putting} className="bg-green text-white text-sm font-medium px-5 py-2.5 rounded-btn hover:bg-green/90 transition-colors disabled:opacity-50">
              {putting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
