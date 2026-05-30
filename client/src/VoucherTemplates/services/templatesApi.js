// ============================================================================
// FinTrack — Voucher Templates API Service Layer
// Mirrors the GL / Vouchers / Reports modules' request() helper and the
// { success, data } / { results } / array response shapes.
// URL prefix: /api/templates/   (config/urls.py -> templates app, when built)
//
// A template is a reusable, pre-filled double-entry voucher: fixed Dr/Cr
// accounts, with amount / date / description left editable at apply time.
// Applying a template creates a real voucher through the existing Vouchers
// module, so every generated entry is fully posted and auditable.
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

export const templatesAPI = {
  // list / filter templates  (params: { type, q })
  list:   (params = {}) => request(`/templates/${qs(params)}`),
  get:    (id) => request(`/templates/${id}/`),

  // manage templates
  create: (payload) => request('/templates/', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id, payload) => request(`/templates/${id}/`, { method: 'PATCH', body: JSON.stringify(payload) }),
  remove: (id) => request(`/templates/${id}/`, { method: 'DELETE' }),

  // apply a template -> creates a voucher from it, with the editable overrides.
  // payload: { amount, date, description, post=true, recurring? }
  apply:  (id, payload) => request(`/templates/${id}/apply/`, { method: 'POST', body: JSON.stringify(payload) }),
};

// Chart-of-Accounts lookup (to resolve / pick accounts) — reuses the COA module.
export const coaAPI = {
  accounts: () => request('/coa/accounts/'),
};

export default { templatesAPI, coaAPI };
