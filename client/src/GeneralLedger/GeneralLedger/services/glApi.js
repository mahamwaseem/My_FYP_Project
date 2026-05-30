// ============================================================================
// FinTrack — General Ledger API Service Layer
// Mirrors the Voucher module's `request()` helper, error handling and the
// { success, data } / { count, results } / array response shapes.
// URL prefix is /api/gl/  (config/urls.py -> gl/urls.py)
// ============================================================================

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

async function request(endpoint, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  const config = { ...options, headers };
  const response = await fetch(`${BASE_URL}${endpoint}`, config);

  const contentType = response.headers.get('content-type');
  const data = contentType && contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const error = new Error(
      (data && data.detail) || (data && data.message) || `HTTP ${response.status}`
    );
    error.status = response.status;
    error.data = data;
    throw error;
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

// ── General Ledger API ───────────────────────────────────────────────────────
export const ledgerAPI = {
  // Chart-of-accounts accounts that have ledger activity
  accounts:       ()              => request('/gl/accounts/'),
  // Trial balance snapshot across all accounts (feature: balances overview)
  trialBalance:   (params = {})   => request(`/gl/trial-balance/${qs(params)}`),
  summary:        ()              => request('/gl/summary/'),

  // FEATURE 1 — Detailed ledger view for one account (debits/credits/running balance)
  accountLedger:  (accountId, params = {}) => request(`/gl/accounts/${accountId}/ledger/${qs(params)}`),

  // FEATURE 2 — Advanced search across historical posted/unposted transactions
  transactions:   (params = {})   => request(`/gl/transactions/${qs(params)}`),
  exportTransactions: (params = {}) => request(`/gl/transactions/export/${qs(params)}`),

  // FEATURE 3 — Automatic posting of transactions to the relevant ledgers
  postingQueue:   ()              => request('/gl/posting/queue/'),
  postingLog:     (params = {})   => request(`/gl/posting/log/${qs(params)}`),
  postEntry:      (id)            => request(`/gl/posting/${id}/post/`, { method: 'POST', body: '{}' }),
  postBatch:      (ids)           => request('/gl/posting/post-batch/', { method: 'POST', body: JSON.stringify({ ids }) }),
  postAll:        ()              => request('/gl/posting/post-all/', { method: 'POST', body: '{}' }),
  setAutoPost:    (enabled)       => request('/gl/posting/auto/', { method: 'POST', body: JSON.stringify({ enabled }) }),

  // FEATURE 4 — Bank reconciliation
  reconciliations:    ()             => request('/gl/reconciliations/'),
  reconciliation:     (id)           => request(`/gl/reconciliations/${id}/`),
  createReconciliation:(data)        => request('/gl/reconciliations/', { method: 'POST', body: JSON.stringify(data) }),
  // unreconciled ledger lines for the account being reconciled
  ledgerLinesForRecon:(accountId, params = {}) => request(`/gl/accounts/${accountId}/unreconciled/${qs(params)}`),
  matchLine:          (reconId, body) => request(`/gl/reconciliations/${reconId}/match/`, { method: 'POST', body: JSON.stringify(body) }),
  unmatchLine:        (reconId, body) => request(`/gl/reconciliations/${reconId}/unmatch/`, { method: 'POST', body: JSON.stringify(body) }),
  finalizeReconciliation:(reconId)   => request(`/gl/reconciliations/${reconId}/finalize/`, { method: 'POST', body: '{}' }),
};

export default { ledgerAPI };
