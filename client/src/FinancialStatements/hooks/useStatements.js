// ============================================================================
// FinTrack — Financial Statements Hooks
// API-first with demo fallback. { data, loading, error, demo, refetch } + toasts.
// To go live-only, remove the `catch` fallbacks marked DEMO FALLBACK.
// ============================================================================
import { useState, useEffect, useCallback } from 'react';
import { statementsAPI } from '../services/statementsApi';
import {
  PERIODS, mockBalanceSheet, mockIncomeStatement, mockCashFlow,
  mockTrialBalance, mockSummary, mockStatuses,
} from '../services/mockData';

let toastListeners = [];
export function emitToast(toast) { toastListeners.forEach((fn) => fn(toast)); }

export function useToastStore() {
  const [toasts, setToasts] = useState([]);
  useEffect(() => {
    const handler = (toast) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { ...toast, id }]);
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), toast.duration || 3500);
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

const apiFor = {
  balance:  statementsAPI.balanceSheet,
  income:   statementsAPI.incomeStatement,
  cashflow: statementsAPI.cashFlow,
  trial:    statementsAPI.trialBalance,
};
const mockFor = {
  balance:  (f, c) => mockBalanceSheet(f, c),
  income:   (f, c) => mockIncomeStatement(f, c),
  cashflow: (f, c) => mockCashFlow(f, c),
  trial:    (f) => mockTrialBalance(f),
};

// One statement, for the chosen period + comparative flag.
export function useStatement(statementId, period, comparative) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [demo, setDemo] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null);
    const params = {
      period: period.id, date_from: period.date_from, date_to: period.date_to,
      comparative: comparative ? 1 : undefined,
    };
    try {
      const res = await apiFor[statementId](params);
      setData(unwrap(res)); setDemo(false);
    } catch (e) {
      setData(mockFor[statementId](period.factor, comparative)); // DEMO FALLBACK
      setDemo(true); setError(e);
    } finally {
      setLoading(false);
    }
  }, [statementId, period, comparative]);

  useEffect(() => { fetchData(); }, [fetchData]);
  return { data, loading, error, demo, refetch: fetchData };
}

// Summary KPIs + per-card statuses for the chosen period.
export function useStatementOverview(period) {
  const [summary, setSummary] = useState(null);
  const [statuses, setStatuses] = useState(null);
  const [demo, setDemo] = useState(false);

  const fetchData = useCallback(async () => {
    const params = { period: period.id, date_from: period.date_from, date_to: period.date_to };
    try {
      const res = await statementsAPI.summary(params);
      const d = unwrap(res);
      setSummary(d);
      setStatuses(d.statuses || mockStatuses(period.factor));
      setDemo(false);
    } catch (e) {
      setSummary(mockSummary(period.factor)); // DEMO FALLBACK
      setStatuses(mockStatuses(period.factor));
      setDemo(true);
    }
  }, [period]);

  useEffect(() => { fetchData(); }, [fetchData]);
  return { summary, statuses, demo, refetch: fetchData };
}

export { PERIODS };
