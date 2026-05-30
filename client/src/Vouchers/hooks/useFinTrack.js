// FinTrack Custom Hooks
import { useState, useEffect, useCallback, useRef } from 'react';
import { voucherAPI, currencyAPI, recurringAPI } from '../services/api';

// ── useToast ─────────────────────────────────────────────────────────────────
let toastListeners = [];
export function emitToast(toast) {
  toastListeners.forEach((fn) => fn(toast));
}

export function useToastStore() {
  const [toasts, setToasts] = useState([]);
  useEffect(() => {
    const handler = (toast) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { ...toast, id }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, toast.duration || 4000);
    };
    toastListeners.push(handler);
    return () => { toastListeners = toastListeners.filter((fn) => fn !== handler); };
  }, []);
  return { toasts };
}

export function useToast() {
  return {
    success: (message, title = 'Success') => emitToast({ type: 'success', title, message }),
    error:   (message, title = 'Error')   => emitToast({ type: 'error',   title, message }),
    info:    (message, title = 'Info')    => emitToast({ type: 'info',    title, message }),
    warning: (message, title = 'Warning') => emitToast({ type: 'warning', title, message }),
  };
}

// ── useVouchers ───────────────────────────────────────────────────────────────
export function useVouchers(params = {}) {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const paramsRef = useRef(params);
  paramsRef.current = params;

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await voucherAPI.list(paramsRef.current);
      setVouchers(res.data || res.results || res || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { vouchers, loading, error, refetch: fetch };
}

// ── useVoucher (single) ───────────────────────────────────────────────────────
export function useVoucher(id) {
  const [voucher, setVoucher] = useState(null);
  const [loading, setLoading] = useState(!!id);
  const [error, setError]     = useState(null);

  const fetch = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await voucherAPI.get(id);
      setVoucher(res.data || res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetch(); }, [fetch]);
  return { voucher, loading, error, refetch: fetch };
}

// ── useSummary ────────────────────────────────────────────────────────────────
export function useSummary() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await voucherAPI.summary();
      setSummary(res.data || res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { summary, loading, error, refetch: fetch };
}

// ── useCurrencies ─────────────────────────────────────────────────────────────
export function useCurrencies() {
  const [currencies, setCurrencies] = useState([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    currencyAPI.list()
      .then((res) => setCurrencies(res.data || res.results || res || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { currencies, loading };
}

// ── useRecurring ──────────────────────────────────────────────────────────────
// Recurring vouchers, derived from the existing voucher list (no new endpoint).
// Pulls vouchers flagged is_recurring and surfaces their schedule fields.
// ── useRecurring ──────────────────────────────────────────────────────────────
// Reads the dedicated recurring-schedules endpoint (/api/vouchers/recurring/),
// where schedules actually live. Maps schedule fields onto the names the
// Recurring view renders. Falls back to the is_recurring voucher flag if the
// schedules endpoint isn't available.
export function useRecurring() {
  const [items, setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  const fetch = useCallback(() => {
    setLoading(true);
    setError(null);

    const mapSchedule = (s) => ({
      id: s.id,
      voucher_no:                 s.template_voucher_no || (s.template_voucher ? `#${s.template_voucher}` : '—'),
      v_type:                     s.v_type || 'JV',
      recurring_frequency:        s.frequency,
      recurring_next_date:        s.next_due_date,
      next_due_date:              s.next_due_date,
      recurring_times_generated:  s.times_generated,
      times_generated:            s.times_generated,
      total_amount:               s.total_amount,
      narration:                  s.narration,
      is_active:                  s.is_active,
    });

    recurringAPI.list({ page_size: 200 })
      .then((res) => {
        const rows = res.results || res.data || res || [];
        setItems(Array.isArray(rows) ? rows.map(mapSchedule) : []);
      })
      .catch(() => {
        // Fallback: older builds without the schedules endpoint — use the flag.
        voucherAPI.list({ is_recurring: true, page_size: 200 })
          .then((res) => {
            const rows = res.data || res.results || res || [];
            setItems(rows.filter((v) => v.is_recurring));
          })
          .catch((e) => setError(e));
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { items, loading, error, refetch: fetch };
}

// ── useAuditLog ───────────────────────────────────────────────────────────────
export function useAuditLog(voucherId) {
  const [logs, setLogs]       = useState([]);
  const [loading, setLoading] = useState(!!voucherId);

  useEffect(() => {
    if (!voucherId) return;
    setLoading(true);
    voucherAPI.audit(voucherId)
      .then((res) => setLogs(res.data || res || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [voucherId]);

  return { logs, loading };
}

// ── useDebounce ───────────────────────────────────────────────────────────────
export function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}