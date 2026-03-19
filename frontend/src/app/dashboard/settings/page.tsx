"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/badge";
import { Modal } from "@/components/modal";
import { FormInput } from "@/components/form-input";
import { useApi, useApiPut, useApiPost } from "@/lib/use-api";
import type { Organization, WalletInfo } from "@/lib/api";

const tabs = ["Organization", "Payroll", "Tax", "Integrations", "Security"];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("Organization");
  const { data: org, loading: orgLoading } = useApi<Organization>("/api/organizations/me");
  const { data: wallet, loading: walletLoading } = useApi<WalletInfo>("/api/wallet/info");

  // Org form state
  const [orgName, setOrgName] = useState<string | null>(null);
  const [orgTaxId, setOrgTaxId] = useState<string | null>(null);
  const [orgCountry, setOrgCountry] = useState<string | null>(null);
  const [orgCurrency, setOrgCurrency] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  const { put, loading: savingOrg } = useApiPut<Record<string, string>, Organization>();

  // Schedule form state
  const [scheduleType, setScheduleType] = useState<string | null>(null);
  const [payDay, setPayDay] = useState<string | null>(null);
  const [scheduleSaveStatus, setScheduleSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  // Viewing key modal state
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keyEmail, setKeyEmail] = useState("");
  const [keyType, setKeyType] = useState("full");
  const [keyExpires, setKeyExpires] = useState("");
  const [generatedKey, setGeneratedKey] = useState("");
  const [keyError, setKeyError] = useState("");

  const { post: postKey, loading: sharingKey } = useApiPost<Record<string, unknown>, { viewing_key: string }>();

  if (orgLoading || walletLoading) {
    return <div className="flex items-center justify-center h-64"><p className="text-secondary text-sm">Loading settings...</p></div>;
  }

  const handleSaveOrg = async () => {
    if (!org) return;
    setSaveStatus("saving");
    try {
      const body: Record<string, string> = {};
      if (orgName !== null) body.name = orgName;
      if (orgTaxId !== null) body.tax_id = orgTaxId;
      if (orgCountry !== null) body.country = orgCountry;
      if (orgCurrency !== null) body.default_currency = orgCurrency;
      if (Object.keys(body).length === 0) {
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
        return;
      }
      await put("/api/organizations/me", body);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch {
      setSaveStatus("idle");
    }
  };

  const handleShareKey = async () => {
    if (!keyEmail) {
      setKeyError("Email is required.");
      return;
    }
    try {
      setKeyError("");
      const result = await postKey("/api/wallet/viewing-keys", {
        shared_with: keyEmail,
        key_type: keyType,
        ...(keyExpires ? { expires_at: keyExpires } : {}),
      });
      setGeneratedKey(result.viewing_key);
    } catch (err) {
      setKeyError(err instanceof Error ? err.message : "Failed to share viewing key.");
    }
  };

  const openKeyModal = () => {
    setKeyEmail("");
    setKeyType("full");
    setKeyExpires("");
    setGeneratedKey("");
    setKeyError("");
    setShowKeyModal(true);
  };

  const handleSaveSchedule = async () => {
    if (!org) return;
    setScheduleSaveStatus("saving");
    try {
      const body: Record<string, unknown> = {};
      const st = scheduleType ?? org.schedule_type;
      body.schedule_type = st;
      if (st !== "none") {
        body.pay_day = Number(payDay ?? org.pay_day ?? 0);
      }
      await put("/api/organizations/me", body as Record<string, string>);
      setScheduleSaveStatus("saved");
      setTimeout(() => setScheduleSaveStatus("idle"), 2000);
    } catch {
      setScheduleSaveStatus("idle");
    }
  };

  const scheduleButtonLabel = scheduleSaveStatus === "saving" ? "Saving..." : scheduleSaveStatus === "saved" ? "Saved" : "Save Schedule";
  const saveButtonLabel = saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "Saved" : "Save Changes";

  return (
    <div className="space-y-section-gap">
      <PageHeader title="Settings" />

      <div className="flex items-center gap-1 border-b border-card-border">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? "border-green text-green"
                : "border-transparent text-secondary hover:text-primary"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Organization" && org && wallet && (
        <div className="space-y-8 max-w-2xl">
          <div className="bg-white border border-card-border rounded-card p-7">
            <h3 className="font-headline font-bold text-base mb-5">Organization Details</h3>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-secondary mb-1.5">Company Name</label>
                <input
                  type="text"
                  value={orgName ?? org.name}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-card-border rounded-btn text-sm focus:outline-none focus:border-green transition-colors"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1.5">Tax ID</label>
                  <input
                    type="text"
                    value={orgTaxId ?? org.tax_id_masked}
                    onChange={(e) => setOrgTaxId(e.target.value)}
                    className="w-full px-4 py-2.5 border border-card-border rounded-btn text-sm focus:outline-none focus:border-green transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1.5">Country</label>
                  <input
                    type="text"
                    value={orgCountry ?? org.country}
                    onChange={(e) => setOrgCountry(e.target.value)}
                    className="w-full px-4 py-2.5 border border-card-border rounded-btn text-sm focus:outline-none focus:border-green transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary mb-1.5">Default Currency</label>
                <input
                  type="text"
                  value={orgCurrency ?? org.default_currency}
                  onChange={(e) => setOrgCurrency(e.target.value)}
                  className="w-full px-4 py-2.5 border border-card-border rounded-btn text-sm focus:outline-none focus:border-green transition-colors"
                />
              </div>
              <button
                onClick={handleSaveOrg}
                disabled={savingOrg}
                className="bg-green text-white text-sm font-medium px-6 py-2.5 rounded-btn hover:bg-green/90 transition-colors disabled:opacity-50"
              >
                {saveButtonLabel}
              </button>
            </div>
          </div>

          <div className="bg-white border border-card-border rounded-card p-7">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-headline font-bold text-base">Zcash Wallet</h3>
              <Badge variant="green">{wallet.status === "connected" ? "Connected" : wallet.status}</Badge>
            </div>
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-secondary">Address</span>
                <span className="text-sm font-mono">{wallet.address_masked}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-t border-row-border">
                <span className="text-sm text-secondary">Balance</span>
                <span className="text-sm font-medium font-tabular">{wallet.balance_zec.toLocaleString()} ZEC</span>
              </div>
              <div className="flex items-center justify-between py-2 border-t border-row-border">
                <span className="text-sm text-secondary">Pool</span>
                <span className="text-sm">{wallet.pool.charAt(0).toUpperCase() + wallet.pool.slice(1)}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-t border-row-border">
                <span className="text-sm text-secondary">Last Synced</span>
                <span className="text-sm text-muted">{new Date(wallet.last_synced).toLocaleString()}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={openKeyModal}
                className="bg-green text-white text-sm font-medium px-5 py-2.5 rounded-btn hover:bg-green/90 transition-colors"
              >
                Share Viewing Key
              </button>
              <button
                disabled
                className="border border-card-border text-muted text-sm font-medium px-5 py-2.5 rounded-btn cursor-not-allowed opacity-50"
                title="No backend endpoint available"
              >
                Rotate Keys
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "Payroll" && org && (
        <div className="space-y-8 max-w-2xl">
          <div className="bg-white border border-card-border rounded-card p-7">
            <h3 className="font-headline font-bold text-base mb-5">Payout Schedule</h3>
            <div className="space-y-5">
              <FormInput
                label="Frequency"
                value={scheduleType ?? org.schedule_type}
                onChange={setScheduleType}
                options={[
                  { label: "None (manual)", value: "none" },
                  { label: "Weekly", value: "weekly" },
                  { label: "Biweekly", value: "biweekly" },
                  { label: "Monthly", value: "monthly" },
                ]}
              />
              {(scheduleType ?? org.schedule_type) === "monthly" && (
                <FormInput
                  label="Day of Month (1-28)"
                  value={payDay ?? String(org.pay_day ?? "")}
                  onChange={setPayDay}
                  type="number"
                  placeholder="15"
                />
              )}
              {((scheduleType ?? org.schedule_type) === "weekly" || (scheduleType ?? org.schedule_type) === "biweekly") && (
                <FormInput
                  label="Day of Week"
                  value={payDay ?? String(org.pay_day ?? "")}
                  onChange={setPayDay}
                  options={[
                    { label: "Monday", value: "0" },
                    { label: "Tuesday", value: "1" },
                    { label: "Wednesday", value: "2" },
                    { label: "Thursday", value: "3" },
                    { label: "Friday", value: "4" },
                    { label: "Saturday", value: "5" },
                    { label: "Sunday", value: "6" },
                  ]}
                />
              )}
              {org.next_payout_date && (scheduleType ?? org.schedule_type) !== "none" && (
                <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-btn">
                  <span className="text-sm text-secondary">Next payout</span>
                  <span className="text-sm font-medium">
                    {new Date(org.next_payout_date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>
              )}
              <button
                onClick={handleSaveSchedule}
                disabled={savingOrg}
                className="bg-green text-white text-sm font-medium px-6 py-2.5 rounded-btn hover:bg-green/90 transition-colors disabled:opacity-50"
              >
                {scheduleButtonLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab !== "Organization" && activeTab !== "Payroll" && (
        <div className="bg-white border border-card-border rounded-card p-12 text-center max-w-2xl">
          <p className="text-secondary text-sm">{activeTab} settings coming soon.</p>
        </div>
      )}

      {/* Share Viewing Key Modal */}
      <Modal open={showKeyModal} onClose={() => setShowKeyModal(false)} title="Share Viewing Key">
        {generatedKey ? (
          <div className="space-y-4">
            <p className="text-sm text-secondary">Viewing key generated. Share it securely with the recipient.</p>
            <textarea
              readOnly
              value={generatedKey}
              className="w-full px-4 py-3 border border-card-border rounded-btn text-xs font-mono bg-gray-50 resize-none h-24 focus:outline-none"
              onClick={(e) => (e.target as HTMLTextAreaElement).select()}
            />
            <div className="flex justify-end">
              <button
                onClick={() => setShowKeyModal(false)}
                className="bg-green text-white text-sm font-medium px-5 py-2.5 rounded-btn hover:bg-green/90 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <FormInput label="Recipient Email" value={keyEmail} onChange={setKeyEmail} type="email" placeholder="recipient@example.com" />
            <FormInput
              label="Key Type"
              value={keyType}
              onChange={setKeyType}
              options={[
                { label: "Full", value: "full" },
                { label: "Incoming only", value: "incoming" },
                { label: "Outgoing only", value: "outgoing" },
              ]}
            />
            <FormInput label="Expires At (optional)" value={keyExpires} onChange={setKeyExpires} type="date" />
            {keyError && <p className="text-sm text-error">{keyError}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowKeyModal(false)} className="border border-card-border text-primary text-sm font-medium px-5 py-2.5 rounded-btn hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleShareKey} disabled={sharingKey} className="bg-green text-white text-sm font-medium px-5 py-2.5 rounded-btn hover:bg-green/90 transition-colors disabled:opacity-50">
                {sharingKey ? "Generating..." : "Generate Key"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
