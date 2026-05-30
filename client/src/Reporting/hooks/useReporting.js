// ============================================================================
// FinTrack — Reporting hooks
// useReport(reportId, params) fetches the right report (API-first, demo
// fallback), exposes { data, loading, demo, refetch }. Plus toast store and a
// per-report CSV-rows builder for export.
// ============================================================================
import { useState, useEffect, useCallback } from 'react';
import { reportingAPI } from '../services/reportingApi';
import {
  demoAccountBalances, demoTransactionSummary, demoAuditTrail,
  demoAccountStatement, demoCustomSummary,
} from '../services/mockData';
import { fmtMoney } from '../utils/reportHelpers';

// ── Toast store ─────────────────────────────────────────────────────────────
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
    success: (m, t = 'Done') => emitToast({ type: 'success', title: t, message: m }),
    error:   (m, t = 'Error') => emitToast({ type: 'error', title: t, message: m }),
    info:    (m, t = 'Info') => emitToast({ type: 'info', title: t, message: m }),
  };
}

function unwrap(res) {
  if (res && typeof res === 'object') {
    if ('data' in res) return res.data;
    if ('results' in res) return res.results;
  }
  return res;
}

// map reportId → (api call, demo payload)
const API_BY_ID = {
  balances: (p) => reportingAPI.accountBalances(p),
  txns:     (p) => reportingAPI.transactionSummary(p),
  audit:    (p) => reportingAPI.auditTrail(p),
  account:  (p) => reportingAPI.accountStatement(p),
  summary:  (p) => reportingAPI.customSummary(p),
};
const DEMO_BY_ID = {
  balances: () => demoAccountBalances(),
  txns:     () => demoTransactionSummary(),
  audit:    () => demoAuditTrail(),
  account:  (p) => demoAccountStatement(p.accountName),
  summary:  () => demoCustomSummary(),
};

// ── useReport ───────────────────────────────────────────────────────────────
export function useReport(reportId, params) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [demo, setDemo] = useState(false);

  const key = JSON.stringify({ reportId, params });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const call = API_BY_ID[reportId];
      const res = await call(params);
      const d = unwrap(res);
      if (d && (Array.isArray(d.rows) ? d.rows.length >= 0 : Object.keys(d).length)) {
        setData(d); setDemo(false);
      } else {
        setData(DEMO_BY_ID[reportId](params)); setDemo(true);
      }
    } catch (e) {
      setData(DEMO_BY_ID[reportId](params)); // DEMO FALLBACK
      setDemo(true);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => { fetchData(); }, [fetchData]);
  return { data, loading, demo, refetch: fetchData };
}

// ── CSV rows per report (returns { header, rows }) ──────────────────────────
export function toCSV(reportId, data) {
  if (!data) return { header: [], rows: [] };
  switch (reportId) {
    case 'balances':
      return {
        header: ['Code', 'Account', 'Type', 'Balance', 'Dr/Cr'],
        rows: [
          ...data.rows.map((r) => [r.code, r.name, r.type, fmtMoney(r.balance), r.side]),
          ['', '', 'TOTAL', fmtMoney(data.total_debit), '='],
        ],
      };
    case 'txns':
      return {
        header: ['Code', 'Account', 'Type', 'Debit', 'Credit', 'Net', 'Entries'],
        rows: [
          ...data.rows.map((r) => [r.code, r.name, r.type, fmtMoney(r.debit), fmtMoney(r.credit), fmtMoney(r.net), r.count]),
          ['', '', 'TOTAL', fmtMoney(data.total_debit), fmtMoney(data.total_credit), '', data.transaction_count],
        ],
      };
    case 'audit':
      return {
        header: ['Timestamp', 'Voucher', 'Action', 'By', 'Note'],
        rows: data.rows.map((r) => [r.ts, r.voucher, r.action, r.by, r.note]),
      };
    case 'account':
      return {
        header: ['Date', 'Voucher', 'Particulars', 'Debit', 'Credit', 'Balance'],
        rows: [
          ['', '', 'Opening balance', '', '', fmtMoney(data.opening)],
          ...data.rows.map((r) => [r.date, r.voucher, r.particulars, fmtMoney(r.debit), fmtMoney(r.credit), fmtMoney(r.balance)]),
          ['', '', 'Closing balance', fmtMoney(data.total_debit), fmtMoney(data.total_credit), fmtMoney(data.closing)],
        ],
      };
    case 'summary':
      return {
        header: ['Metric', data.current_label, data.prior_label, 'Change'],
        rows: data.groups.map((g) => [g.label, fmtMoney(g.current), fmtMoney(g.prior), fmtMoney(g.current - g.prior)]),
      };
    default:
      return { header: [], rows: [] };
  }
}
