// FinTrack API Service Layer
// Handles all HTTP communication with Django REST Framework backend

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// ── CSRF Token Management ────────────────────────────────────────────────────
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

function getCSRFToken() {
  return getCookie('csrftoken') || localStorage.getItem('csrftoken') || '';
}

// ── Base Fetch Wrapper ───────────────────────────────────────────────────────
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('authToken');
  const csrfToken = getCSRFToken();

  const headers = {
    'Content-Type': 'application/json',
    'X-CSRFToken': csrfToken,
    'X-Requested-With': 'XMLHttpRequest',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
    credentials: 'include',
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, config);

  // Handle non-JSON responses
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

// ── Voucher API ──────────────────────────────────────────────────────────────
export const voucherAPI = {
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/vouchers/${query ? `?${query}` : ''}`);
  },

  get: (id) => request(`/vouchers/${id}/`),

  create: (data) => request('/vouchers/', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  update: (id, data) => request(`/vouchers/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  delete: (id) => request(`/vouchers/${id}/`, { method: 'DELETE' }),

  post: (id) => request(`/vouchers/${id}/post/`, { method: 'POST' }),

  reverse: (id, data) => request(`/vouchers/${id}/reverse/`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  audit: (id) => request(`/vouchers/${id}/audit/`),

  print: (id) => request(`/vouchers/${id}/print/`),

  summary: () => request('/vouchers/summary/'),
};

// ── Currency API ─────────────────────────────────────────────────────────────
export const currencyAPI = {
  list: () => request('/currencies/'),
  create: (data) => request('/currencies/', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => request(`/currencies/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id) => request(`/currencies/${id}/`, { method: 'DELETE' }),
};

export default { voucherAPI, currencyAPI };
