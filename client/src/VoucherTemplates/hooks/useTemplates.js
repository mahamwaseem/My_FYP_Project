// ============================================================================
// FinTrack — Voucher Templates hooks
// API-first with demo fallback. { templates, loading, demo, refetch }, an apply
// action that creates a voucher (real endpoint, or simulated in demo), and the
// shared toast store — same shape as the other modules.
// To go live-only, remove the `catch` fallbacks marked DEMO FALLBACK.
// ============================================================================
import { useState, useEffect, useCallback } from 'react';
import { templatesAPI } from '../services/templatesApi';
import { TEMPLATES } from '../services/mockData';
import { buildApplyPayload } from '../utils/templateHelpers';

// ── Toast store ───────────────────────────────────────────────────────────
let toastListeners = [];
export function emitToast(toast) { toastListeners.forEach((fn) => fn(toast)); }

export function useToastStore() {
  const [toasts, setToasts] = useState([]);
  useEffect(() => {
    const handler = (toast) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { ...toast, id }]);
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), toast.duration || 3800);
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

function unwrap(res) {
  if (res && typeof res === 'object') {
    if ('data' in res) return res.data;
    if ('results' in res) return res.results;
  }
  return res;
}

// Map a backend template (v_type, default_amount, is_recurring, lines[{account_name,side}])
// onto the shape the UI components expect (type, amount, recurring, lines[{account,side}]).
function normalizeTemplate(t) {
  if (!t) return t;
  // already in UI shape (demo data) — leave it
  if (t.type && t.amount !== undefined) return t;
  return {
    ...t,
    type:        t.v_type ?? t.type,
    amount:      Number(t.default_amount ?? t.amount ?? 0),
    recurring:   t.is_recurring ?? t.recurring ?? false,
    frequency:   t.frequency || '',
    description: t.description || '',
    tag:         t.tag || '',
    lines: Array.isArray(t.lines)
      ? t.lines.map((l) => ({
          account: l.account_name ?? l.account ?? '',
          side:    l.side,
        }))
      : [],
  };
}

// ── useTemplates(): the catalogue ───────────────────────────────────────────
export function useTemplates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [demo, setDemo] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await templatesAPI.list();
      const data = unwrap(res);
      const hasData = Array.isArray(data) && data.length;
      setTemplates(hasData ? data.map(normalizeTemplate) : TEMPLATES);
      setDemo(!hasData);
    } catch (e) {
      setTemplates(TEMPLATES); // DEMO FALLBACK
      setDemo(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  return { templates, loading, demo, refetch: fetchData };
}

// ── useApplyTemplate(): create a voucher from a template ────────────────────
export function useApplyTemplate() {
  const [submitting, setSubmitting] = useState(false);

  const apply = useCallback(async (template, overrides) => {
    setSubmitting(true);
    const payload = buildApplyPayload(template, overrides);
    try {
      const res = await templatesAPI.apply(template.id, payload);
      return { ok: true, demo: false, data: unwrap(res), payload };
    } catch (e) {
      // Real failure — report it honestly (e.g. 403 = no permission). Never
      // fake a success: the voucher was NOT created.
      const status = e && e.status;
      let message = (e && (e.data?.detail || e.data?.message || e.message)) || 'Could not create the voucher.';
      if (status === 403) {
        message = "You don't have permission to create vouchers. This action requires an Accountant or Administrator role.";
      } else if (status === 401) {
        message = 'Your session has expired. Please sign in again.';
      }
      return { ok: false, demo: false, error: message, status, payload };
    } finally {
      setSubmitting(false);
    }
  }, []);

  return { apply, submitting };
}