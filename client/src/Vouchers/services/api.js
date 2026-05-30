// FinTrack API Service Layer

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

async function request(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

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
    error.data   = data;
    throw error;
  }

  return data;
}

// ── Voucher API ──────────────────────────────────────────────────────────────
// URL prefix is /api/vouchers/ (set in config/urls.py → vouchers/urls.py)
export const voucherAPI = {
  list:    (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/vouchers/${query ? `?${query}` : ''}`);
  },
  get:     (id)       => request(`/vouchers/${id}/`),
  create:  (data)     => request('/vouchers/',        { method: 'POST', body: JSON.stringify(data) }),
  update:  (id, data) => request(`/vouchers/${id}/`,  { method: 'PUT',  body: JSON.stringify(data) }),
  delete:  (id)       => request(`/vouchers/${id}/`,  { method: 'DELETE' }),
  post:    (id)       => request(`/vouchers/${id}/post/`,    { method: 'POST', body: '{}' }),
  reverse: (id, data) => request(`/vouchers/${id}/reverse/`, { method: 'POST', body: JSON.stringify(data) }),
  audit:   (id)       => request(`/vouchers/${id}/audit/`),
  print:   (id)       => request(`/vouchers/${id}/print/`),
  summary: ()         => request('/vouchers/summary/'),
};

// ── Currency API ─────────────────────────────────────────────────────────────
export const currencyAPI = {
  list:   ()          => request('/vouchers/currencies/'),
  create: (data)      => request('/vouchers/currencies/',        { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data)  => request(`/vouchers/currencies/${id}/`,  { method: 'PUT',  body: JSON.stringify(data) }),
  delete: (id)        => request(`/vouchers/currencies/${id}/`,  { method: 'DELETE' }),
  // automatic conversion via stored rates: { amount, from, to }
  convert: ({ amount, from, to }) =>
    request(`/vouchers/currencies/convert/?amount=${encodeURIComponent(amount)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`),
  rates:   (base) => request(`/vouchers/currencies/rates/${base ? `?base=${encodeURIComponent(base)}` : ''}`),
};

// ── Recurring Schedule API ───────────────────────────────────────────────────
// URL prefix /api/vouchers/recurring/ (vouchers/urls.py → RecurringScheduleViewSet)
export const recurringAPI = {
  list:     (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/vouchers/recurring/${query ? `?${query}` : ''}`);
  },
  get:      (id)       => request(`/vouchers/recurring/${id}/`),
  create:   (data)     => request('/vouchers/recurring/',        { method: 'POST', body: JSON.stringify(data) }),
  update:   (id, data) => request(`/vouchers/recurring/${id}/`,  { method: 'PUT',  body: JSON.stringify(data) }),
  delete:   (id)       => request(`/vouchers/recurring/${id}/`,  { method: 'DELETE' }),
  due:      ()         => request('/vouchers/recurring/due/'),
  generate: (id, data = {}) => request(`/vouchers/recurring/${id}/generate/`, { method: 'POST', body: JSON.stringify(data) }),
  toggle:   (id)       => request(`/vouchers/recurring/${id}/toggle/`, { method: 'POST', body: '{}' }),
};

// ── COA API ──────────────────────────────────────────────────────────────────
export const coaAPI = {
  groups:     ()          => request('/coa/groups/'),
  categories: ()          => request('/coa/categories/'),
  classes:    ()          => request('/coa/classes/'),
  accounts:   ()          => request('/coa/accounts/'),
  account:    (id)        => request(`/coa/accounts/${id}/`),
};

export default { voucherAPI, currencyAPI, recurringAPI, coaAPI };