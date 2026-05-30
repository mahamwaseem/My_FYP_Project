// ============================================================================
// FinTrack — Reporting API service layer
// The Reporting module is a report *generator*: it assembles operational and
// financial reports from posted ledger data. It reuses the existing backends
// (/api/reports/ for statements, /api/gl/ for ledger, /api/vouchers/ for audit)
// and adds report-specific endpoints when the backend is built.
//
// Mirrors the request() helper + { success, data } / { results } shapes used
// across the other modules.
// ============================================================================

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

async function request(endpoint, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
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

// Each method maps to a report. Params: { period, date_from, date_to, account, compare }
export const reportingAPI = {
  // operational reports (new endpoints, /api/reporting/)
  accountBalances:    (p = {}) => request(`/reporting/account-balances/${qs(p)}`),
  transactionSummary: (p = {}) => request(`/reporting/transaction-summary/${qs(p)}`),
  auditTrail:         (p = {}) => request(`/reporting/audit-trail/${qs(p)}`),
  accountStatement:   (p = {}) => request(`/reporting/account-statement/${qs(p)}`),
  customSummary:      (p = {}) => request(`/reporting/custom-summary/${qs(p)}`),

  // export any report: format=csv|json
  export: (reportId, p = {}) => request(`/reporting/${reportId}/export/${qs(p)}`),
};

// account list for the Account Statement picker (reuses COA)
export const coaAPI = {
  accounts: () => request('/coa/accounts/'),
};

export default { reportingAPI, coaAPI };
