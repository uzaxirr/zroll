const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

async function fetchAPI<T>(
  path: string,
  options?: RequestInit & { token?: string }
): Promise<T> {
  const { token, ...fetchOptions } = options || {};
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(`${API_BASE}${path}`, {
    ...fetchOptions,
    headers: { ...headers, ...((fetchOptions.headers as Record<string, string>) || {}) },
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

// Dashboard
export const getDashboardStats = (token: string) =>
  fetchAPI<DashboardStats>("/api/dashboard/stats", { token });

export const getRecentPayments = (token: string, limit = 5) =>
  fetchAPI<RecentPayment[]>(`/api/payroll/recent?limit=${limit}`, { token });

// Payroll
export const preparePayroll = (token: string) =>
  fetchAPI<PayrollPrepare>("/api/payroll/prepare", { token });

export const executePayroll = (token: string, body: PayrollExecuteBody) =>
  fetchAPI<{ payroll_run_id: string; status: string }>("/api/payroll/execute", {
    token,
    method: "POST",
    body: JSON.stringify(body),
  });

export const executePayrollZodl = (token: string, body: PayrollExecuteBody) =>
  fetchAPI<PayrollZodlResponse>("/api/payroll/execute-zodl", {
    token,
    method: "POST",
    body: JSON.stringify(body),
  });

export const confirmPayrollTx = (token: string, runId: string, txId: string) =>
  fetchAPI<{ status: string; payroll_run_id: string }>(`/api/payroll/${runId}/confirm-tx`, {
    token,
    method: "POST",
    body: JSON.stringify({ tx_id: txId }),
  });

export const getPayrollRun = (token: string, runId: string) =>
  fetchAPI<PayrollRun>(`/api/payroll/${runId}`, { token });

export const getPayrollHistory = (token: string, page = 1, limit = 20) =>
  fetchAPI<PayrollHistoryResponse>(`/api/payroll/history?page=${page}&limit=${limit}`, { token });

// Contributors
export const getContributors = (token: string, department = "all", page = 1) =>
  fetchAPI<ContributorsResponse>(`/api/contributors?department=${department}&page=${page}`, { token });

// Settings
export const getOrganization = (token: string) =>
  fetchAPI<Organization>("/api/organizations/me", { token });

export const getWalletInfo = (token: string) =>
  fetchAPI<WalletInfo>("/api/wallet/info", { token });

// Contributor Portal
export const getContributorStats = (token: string) =>
  fetchAPI<ContributorStats>("/api/contributor/stats", { token });

export const getContributorPayments = (token: string, page = 1) =>
  fetchAPI<ContributorPaymentsResponse>("/api/contributor/payments?page=" + page, { token });

export const getPayStub = (token: string, itemId: string) =>
  fetchAPI<PayStub>(`/api/contributor/payments/${itemId}/stub`, { token });

// Portfolio
export const getPortfolio = (token: string, period = "7d") =>
  fetchAPI<PortfolioResponse>(`/api/contributor/portfolio?period=${period}`, { token });

export const getContributorTransactions = (token: string, limit = 5) =>
  fetchAPI<ContributorTransaction[]>(`/api/contributor/transactions?limit=${limit}`, { token });

// Tax
export const getTaxSummary = (token: string, year = 2026) =>
  fetchAPI<TaxSummaryResponse>(`/api/contributor/tax-summary?year=${year}`, { token });

export const getTaxEvents = (token: string, year = 2026, type = "all") =>
  fetchAPI<TaxEvent[]>(`/api/contributor/tax-events?year=${year}&type=${type}`, { token });

// Types
export interface DashboardStats {
  total_payroll_usd: number;
  total_payroll_zec: number;
  contributor_count: number;
  next_payroll_date: string | null;
  shielded_percentage: number;
  current_zec_rate: number;
  pending_approval_count: number;
  schedule_type: string;
}

export interface RecentPayment {
  contributor_name: string;
  amount_zec: number;
  amount_usd: number;
  date: string;
  status: string;
  department: string;
}

export interface PayrollPrepare {
  period: string;
  contributors: PayrollContributor[];
  zec_rate_usd: number;
  org_wallet_balance_zec: number;
  estimated_total_usd: number;
  estimated_total_zec: number;
  estimated_network_fee: number;
}

export interface PayrollContributor {
  id: string;
  name: string;
  department: string;
  monthly_rate_usd: number;
  wallet_address_masked: string;
  tax_rate: number;
}

export interface PayrollExecuteBody {
  period_label: string;
  period_start: string;
  period_end: string;
  items: { contributor_id: string; gross_usd: number; tax_withheld_usd: number }[];
  lock_zec_rate: boolean;
}

export interface PayrollZodlResponse {
  payroll_run_id: string;
  payment_uri: string;
  status: string;
  cross_pay_count?: number;
}

export interface PayrollRun {
  id: string;
  status: string;
  total_zec: number;
  total_usd: number;
  recipient_count: number;
  network_fee_zec: number;
  tx_id: string;
  block_height: number;
  confirmations: number;
  pool: string;
  period_label: string;
  executed_at: string;
  payment_uri?: string;
  items?: PayrollRunItem[];
}

export interface PayrollRunItem {
  contributor_name: string;
  department: string;
  gross_usd: number;
  tax_withheld_usd: number;
  net_usd: number;
  zec_amount: number;
  status: string;
}

export interface PayrollHistoryResponse {
  runs: PayrollRun[];
  total_pages: number;
}

export interface Contributor {
  id: string;
  full_name: string;
  email: string;
  department: string;
  wallet_address_masked: string;
  monthly_rate_usd: number;
  status: string;
  verification_status: string;
  payment_preference: "zec" | "usdc";
  destination_chain: "solana" | "ethereum" | "base" | "arbitrum" | null;
  destination_address_masked: string | null;
}

export interface ContributorsResponse {
  total: number;
  departments: { name: string; count: number }[];
  contributors: Contributor[];
}

export interface Organization {
  name: string;
  tax_id_masked: string;
  country: string;
  default_currency: string;
  schedule_type: string;
  pay_day: number | null;
  next_payout_date: string | null;
}

export interface WalletInfo {
  address_masked: string;
  balance_zec: number;
  pool: string;
  status: string;
  last_synced: string;
}

export interface ContributorStats {
  total_received_zec: number;
  total_received_usd: number;
  last_payment_zec: number;
  last_payment_date: string;
  organization_count: number;
  organizations: string[];
  verification_status: string;
  test_tx_id: string | null;
}

export interface ContributorPaymentsResponse {
  payments: ContributorPayment[];
}

export interface ContributorPayment {
  date: string;
  amount_zec: number;
  amount_usd: number;
  from: string;
  status: string;
  payroll_item_id: string;
  tx_id: string | null;
  confirmations: number;
  memo: {
    org: string;
    period: string;
    type: string;
    gross: number;
    tax: number;
    net: number;
    rate: number;
    ref: string;
  } | null;
}

export interface PayStub {
  organization: string;
  period: string;
  type: string;
  gross_usd: number;
  tax_withheld_usd: number;
  net_usd: number;
  zec_rate: number;
  zec_amount: number;
  reference: string;
  source: string;
}

export interface ContributorViewingKey {
  has_key: boolean;
  viewing_key: string | null;
  key_type: string | null;
}

export interface PortfolioResponse {
  balance_zec: number;
  balance_usd: number;
  zec_rate: number;
  change_usd: number;
  change_pct: number;
  chart_data: { timestamp: string; value_usd: number }[];
}

export interface ContributorTransaction {
  type: string;
  description: string;
  date: string;
  amount_zec: number;
  amount_usd: number;
  direction: string;
}

export interface TaxSummaryResponse {
  total_income_usd: number;
  total_income_zec: number;
  tax_withheld_usd: number;
  pay_periods: number;
  unrealized_gain_usd: number;
  cost_basis_method: string;
  estimated_tax_due: number;
}

export interface TaxEvent {
  date: string;
  event_type: string;
  amount_zec: number;
  cost_basis_usd: number;
  fair_value_usd: number;
  gain_loss_usd: number;
}
