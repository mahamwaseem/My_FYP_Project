// ============================================================================
// FinTrack — Auth API service layer
// Talks to the Django auth backend (JWT). Endpoints align with the backend
// we build next: /api/auth/ for register/login/profile, /api/auth/users/ for
// admin user management. Stores the access + refresh tokens and attaches the
// access token to every request. Auto-refreshes on 401.
// ============================================================================

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// ── token storage ────────────────────────────────────────────────────────────
const ACCESS_KEY = 'fintrack_access';
const REFRESH_KEY = 'fintrack_refresh';

export const tokenStore = {
  get access()  { return localStorage.getItem(ACCESS_KEY); },
  get refresh() { return localStorage.getItem(REFRESH_KEY); },
  set({ access, refresh }) {
    if (access) localStorage.setItem(ACCESS_KEY, access);
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear() { localStorage.removeItem(ACCESS_KEY); localStorage.removeItem(REFRESH_KEY); },
  get hasToken() { return !!localStorage.getItem(ACCESS_KEY); },
};

// ── core request helper (attaches token, refreshes on 401) ───────────────────
async function request(endpoint, { method = 'GET', body, auth = true, _retry = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth && tokenStore.access) headers.Authorization = `Bearer ${tokenStore.access}`;

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method, headers, body: body ? JSON.stringify(body) : undefined,
  });

  // try one refresh on expired access token
  if (res.status === 401 && auth && !_retry && tokenStore.refresh) {
    const refreshed = await tryRefresh();
    if (refreshed) return request(endpoint, { method, body, auth, _retry: true });
  }

  const ct = res.headers.get('content-type');
  const data = ct && ct.includes('application/json') ? await res.json() : await res.text();
  if (!res.ok) {
    const err = new Error(extractError(data) || `HTTP ${res.status}`);
    err.status = res.status; err.data = data;
    throw err;
  }
  return data;
}

function extractError(data) {
  if (!data || typeof data !== 'object') return null;
  if (data.detail) return data.detail;
  if (data.message) return data.message;
  // DRF field errors → first message
  const first = Object.values(data)[0];
  if (Array.isArray(first)) return first[0];
  if (typeof first === 'string') return first;
  return null;
}

async function tryRefresh() {
  try {
    const res = await fetch(`${BASE_URL}/auth/token/refresh/`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: tokenStore.refresh }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    if (data.access) { tokenStore.set({ access: data.access }); return true; }
    return false;
  } catch { return false; }
}

// unwrap { success, data } or raw
function unwrap(res) {
  if (res && typeof res === 'object' && 'data' in res) return res.data;
  return res;
}

// ── auth endpoints ───────────────────────────────────────────────────────────
export const authAPI = {
  // returns { access, refresh, user }
  async login(email, password) {
    const res = await request('/auth/login/', { method: 'POST', auth: false, body: { email, password } });
    const d = unwrap(res);
    if (d.access) tokenStore.set({ access: d.access, refresh: d.refresh });
    return d;
  },

  async register({ name, email, password, confirm_password }) {
    const res = await request('/auth/register/', {
      method: 'POST', auth: false, body: { name, email, password, confirm_password },
    });
    const d = unwrap(res);
    if (d.access) tokenStore.set({ access: d.access, refresh: d.refresh });
    return d;
  },

  async profile() {
    const res = await request('/auth/profile/');
    return unwrap(res);
  },

  async logout() {
    try { await request('/auth/logout/', { method: 'POST', body: { refresh: tokenStore.refresh } }); }
    catch { /* ignore — clear locally regardless */ }
    tokenStore.clear();
  },
};

// ── admin user-management endpoints ──────────────────────────────────────────
export const usersAPI = {
  async list() { return unwrap(await request('/auth/users/')); },
  async create({ name, email, password, role }) {
    return unwrap(await request('/auth/users/', { method: 'POST', body: { name, email, password, role } }));
  },
  async setRole(id, role) {
    return unwrap(await request(`/auth/users/${id}/role/`, { method: 'PATCH', body: { role } }));
  },
  async setStatus(id, status) {
    return unwrap(await request(`/auth/users/${id}/status/`, { method: 'PATCH', body: { status } }));
  },
  async setPassword(id, password) {
    return unwrap(await request(`/auth/users/${id}/password/`, { method: 'PATCH', body: { password } }));
  },
};

// ── self-service: change my own password ─────────────────────────────────────
export async function changeMyPassword({ current_password, new_password, confirm_password }) {
  return unwrap(await request('/auth/change-password/', {
    method: 'POST',
    body: { current_password, new_password, confirm_password },
  }));
}

export default { authAPI, usersAPI, tokenStore, changeMyPassword };
