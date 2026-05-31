// ============================================================================
// FinTrack — Auth hooks: toast store + admin user-management hook.
// ============================================================================
import { useState, useEffect, useCallback } from 'react';
import { usersAPI } from '../services/authApi';

// ── toast store ─────────────────────────────────────────────────────────────
let listeners = [];
export function emitToast(t) { listeners.forEach((fn) => fn(t)); }
export function useToastStore() {
  const [toasts, setToasts] = useState([]);
  useEffect(() => {
    const handler = (t) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { ...t, id }]);
      setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), t.duration || 3600);
    };
    listeners.push(handler);
    return () => { listeners = listeners.filter((fn) => fn !== handler); };
  }, []);
  return { toasts };
}
export function useToast() {
  return {
    success: (m, t = 'Success') => emitToast({ type: 'success', title: t, message: m }),
    error:   (m, t = 'Error') => emitToast({ type: 'error', title: t, message: m }),
    info:    (m, t = 'Info') => emitToast({ type: 'info', title: t, message: m }),
  };
}

// ── admin: users management ──────────────────────────────────────────────────
export function useUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [demo, setDemo] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await usersAPI.list();
      if (Array.isArray(list)) { setUsers(list); setDemo(false); }
      else if (Array.isArray(list?.results)) { setUsers(list.results); setDemo(false); }
      else { setUsers([]); setDemo(false); }
    } catch (e) {
      // Backend is live now — surface the real failure rather than hiding it
      // behind fake demo users. Show an empty table + let the toast/Network
      // tab reveal the cause (e.g. 403 = not an admin, 401 = token issue).
      console.error('Failed to load users:', e.status, e.message);
      setUsers([]); setDemo(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // optimistic local update + API call (no-op on demo)
  const setRole = useCallback(async (id, role) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)));
    if (!demo) { try { await usersAPI.setRole(id, role); } catch { /* keep optimistic */ } }
  }, [demo]);

  const setStatus = useCallback(async (id, status) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status } : u)));
    if (!demo) { try { await usersAPI.setStatus(id, status); } catch { /* keep optimistic */ } }
  }, [demo]);

  const createUser = useCallback(async (payload) => {
    if (demo) {
      const id = Math.max(0, ...users.map((u) => u.id)) + 1;
      const newUser = {
        id, user_id: `USR-${String(id).padStart(3, '0')}`,
        name: payload.name, email: payload.email, role: payload.role,
        status: 'active', last_login: '—',
      };
      setUsers((prev) => [...prev, newUser]);
      return newUser;
    }
    const created = await usersAPI.create(payload);
    await load();
    return created;
  }, [demo, users, load]);

  const setPassword = useCallback(async (id, password) => {
    // not optimistic — return the result so the caller can confirm/toast
    return usersAPI.setPassword(id, password);
  }, []);

  return { users, loading, demo, reload: load, setRole, setStatus, createUser, setPassword };
}
