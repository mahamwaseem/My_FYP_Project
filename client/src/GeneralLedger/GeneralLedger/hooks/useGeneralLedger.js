// ============================================================================
// FinTrack — General Ledger Hooks
// Same shape as the Voucher module's useFinTrack: { data, loading, error,
// refetch } plus a toast store. Each hook tries the live API first and falls
// back to seed data so the module is demonstrable before the backend exists.
// To go live-only, remove the `catch` fallbacks marked DEMO FALLBACK.
// ============================================================================
import { useState, useEffect, useCallback, useRef } from 'react';
import { ledgerAPI } from '../services/glApi';
import {
  MOCK_ACCOUNTS, MOCK_ENTRIES, MOCK_POSTING_QUEUE, MOCK_POSTING_LOG, MOCK_RECONCILIATIONS,
} from '../services/mockData';

// ── Toast store ──────────────────────────────────────────────────────────────
let toastListeners = [];
export function emitToast(toast) { toastListeners.forEach((fn) => fn(toast)); }

export function useToastStore() {
  const [toasts, setToasts] = useState([]);
  useEffect(() => {
    const handler = (toast) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { ...toast, id }]);
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), toast.duration || 4000);
    };
    toastListeners.push(handler);
    return () => { toastListeners = toastListeners.filter((fn) => fn !== handler); };
  }, []);
  return { toasts };
}

export function useToast() {
  return {
    success: (m, t = 'Success') => emitToast({ type: 'success', title: t, message: m }),
    error:   (m, t = 'Error')   => emitToast({ type: 'error',   title: t, message: m }),
    info:    (m, t = 'Info')    => emitToast({ type: 'info',    title: t, message: m }),
    warning: (m, t = 'Warning') => emitToast({ type: 'warning', title: t, message: m }),
  };
}

// ── useDebounce ──────────────────────────────────────────────────────────────
export function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// Normalise the three possible response shapes used across FinTrack.
function unwrapList(res) {
  if (Array.isArray(res)) return res;
  if (res && Array.isArray(res.data)) return res.data;
  if (res && Array.isArray(res.results)) return res.results;
  return [];
}

// ── useAccounts (chart of accounts with ledger activity) ─────────────────────
export function useAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await ledgerAPI.accounts();
      const list = unwrapList(res);
      setAccounts(list.length ? list : MOCK_ACCOUNTS); // DEMO FALLBACK
    } catch {
      setAccounts(MOCK_ACCOUNTS); // DEMO FALLBACK
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { accounts, loading, error, refetch: fetch };
}

// ── useAccountLedger — FEATURE 1: detailed ledger for one account ────────────
export function useAccountLedger(accountId, params = {}) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(!!accountId);
  const [error, setError]     = useState(null);
  const paramsRef = useRef(params); paramsRef.current = params;

  const fetch = useCallback(async () => {
    if (!accountId) return;
    setLoading(true); setError(null);
    try {
      const res = await ledgerAPI.accountLedger(accountId, paramsRef.current);
      const list = unwrapList(res);
      setEntries(list.length ? list : MOCK_ENTRIES.filter((e) => e.account_id === Number(accountId))); // DEMO FALLBACK
    } catch {
      setEntries(MOCK_ENTRIES.filter((e) => e.account_id === Number(accountId))); // DEMO FALLBACK
    } finally { setLoading(false); }
  }, [accountId]);

  useEffect(() => { fetch(); }, [fetch]);
  return { entries, loading, error, refetch: fetch };
}

// ── useTransactions — FEATURE 2: advanced historical search ──────────────────
export function useTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const search = useCallback(async (filters = {}) => {
    setLoading(true); setError(null);
    try {
      const res = await ledgerAPI.transactions(filters);
      const list = unwrapList(res);
      setTransactions(list.length ? list : applyClientFilters(MOCK_ENTRIES, filters)); // DEMO FALLBACK
    } catch {
      setTransactions(applyClientFilters(MOCK_ENTRIES, filters)); // DEMO FALLBACK
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { search({}); }, [search]);
  return { transactions, loading, error, search };
}

// Client-side equivalent of the backend advanced filter (demo only).
function applyClientFilters(entries, f) {
  let data = [...entries];
  if (f.account)    data = data.filter((e) => String(e.account_id) === String(f.account));
  if (f.type)       data = data.filter((e) => e.voucher_type === f.type);
  if (f.from)       data = data.filter((e) => e.date >= f.from);
  if (f.to)         data = data.filter((e) => e.date <= f.to);
  if (f.min_amount) data = data.filter((e) => Math.max(e.debit, e.credit) >= parseFloat(f.min_amount));
  if (f.max_amount) data = data.filter((e) => Math.max(e.debit, e.credit) <= parseFloat(f.max_amount));
  if (f.side === 'debit')  data = data.filter((e) => e.debit > 0);
  if (f.side === 'credit') data = data.filter((e) => e.credit > 0);
  if (f.q) {
    const q = f.q.toLowerCase();
    data = data.filter((e) =>
      (e.voucher_no || '').toLowerCase().includes(q) ||
      (e.narration  || '').toLowerCase().includes(q) ||
      (e.reference  || '').toLowerCase().includes(q));
  }
  return data;
}

// ── usePostingQueue — FEATURE 3: automatic posting ───────────────────────────
export function usePostingQueue() {
  const [queue, setQueue] = useState([]);
  const [log, setLog]     = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const [qRes, lRes] = await Promise.all([
        ledgerAPI.postingQueue().catch(() => null),
        ledgerAPI.postingLog().catch(() => null),
      ]);
      const q = unwrapList(qRes); const l = unwrapList(lRes);
      setQueue(q.length ? q : MOCK_POSTING_QUEUE);     // DEMO FALLBACK
      setLog(l.length ? l : MOCK_POSTING_LOG);         // DEMO FALLBACK
    } catch {
      setQueue(MOCK_POSTING_QUEUE); setLog(MOCK_POSTING_LOG); // DEMO FALLBACK
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { queue, log, loading, refetch: fetch };
}

// ── useReconciliations — FEATURE 4 ───────────────────────────────────────────
export function useReconciliations() {
  const [reconciliations, setReconciliations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ledgerAPI.reconciliations();
      const list = unwrapList(res);
      setReconciliations(list.length ? list : MOCK_RECONCILIATIONS); // DEMO FALLBACK
    } catch {
      setReconciliations(MOCK_RECONCILIATIONS); // DEMO FALLBACK
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { reconciliations, loading, refetch: fetch };
}
