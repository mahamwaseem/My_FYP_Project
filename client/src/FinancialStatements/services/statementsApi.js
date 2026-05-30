// ============================================================================
// FinTrack — Financial Statements API Service Layer
// Mirrors the GL/Voucher modules' `request()` helper, error handling and the
// { success, data } / { count, results } / array response shapes.
// URL prefix is /api/reports/  (config/urls.py -> reports/urls.py)
//
// Statements are DERIVED from posted ledger data (the same posted VoucherDetail
// lines the General Ledger reads). Trial Balance already exists in the GL app
// at /api/gl/trial-balance/ — this layer can reuse it. Adjust paths if needed.
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

// All accept { period, date_from, date_to, comparative } query params.
export const statementsAPI = {
  summary:         (params = {}) => request(`/reports/summary/${qs(params)}`),
  balanceSheet:    (params = {}) => request(`/reports/balance-sheet/${qs(params)}`),
  incomeStatement: (params = {}) => request(`/reports/income-statement/${qs(params)}`),
  cashFlow:        (params = {}) => request(`/reports/cash-flow/${qs(params)}`),
  trialBalance:    (params = {}) => request(`/reports/trial-balance/${qs(params)}`),
  export: (statement, format, params = {}) =>
    request(`/reports/${statement}/export/${qs({ ...params, format })}`),
};

export default { statementsAPI };
