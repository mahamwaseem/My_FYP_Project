// ============================================================================
// FinTrack — Financial Dashboard API service
// Pure aggregator: pulls from existing backends to assemble the dashboard.
//   • /api/reporting/custom-summary/     → Income, Expenses, Net Profit, Assets, Equity (current vs prior)
//   • /api/reporting/account-balances/   → balances for the position breakdown
//   • /api/reporting/transaction-summary/→ per-account debit/credit for the period
//   • /api/reporting/audit-trail/        → recent activity feed
//   • /api/vouchers/summary/             → voucher counts (drafts pending, posted, etc.)
// Shares the request() helper + auth-token pattern used across the app.
// ============================================================================

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

async function request(endpoint, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  const token = localStorage.getItem('fintrack_access');
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
  const ct = response.headers.get('content-type');
  const data = ct && ct.includes('application/json') ? await response.json() : await response.text();
  if (!response.ok) {
    const err = new Error((data && (data.detail || data.message)) || `HTTP ${response.status}`);
    err.status = response.status; err.data = data;
    throw err;
  }
  return data;
}

const qs = (params = {}) => {
  const clean = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
  );
  const s = new URLSearchParams(clean).toString();
  return s ? `?${s}` : '';
};

const unwrap = (r) => (r && typeof r === 'object' && 'data' in r ? r.data : r);

export const dashboardAPI = {
  summary:        (p = {}) => request(`/reporting/custom-summary/${qs(p)}`).then(unwrap),
  accountBalances:(p = {}) => request(`/reporting/account-balances/${qs(p)}`).then(unwrap),
  txnSummary:     (p = {}) => request(`/reporting/transaction-summary/${qs(p)}`).then(unwrap),
  auditTrail:     (p = {}) => request(`/reporting/audit-trail/${qs(p)}`).then(unwrap),
  voucherSummary: (p = {}) => request(`/vouchers/summary/${qs(p)}`).then(unwrap),
};

export default { dashboardAPI };
