import { useState, useEffect, useCallback } from 'react';
import { dashboardAPI } from '../services/dashboardApi';

// Default period: the current month-to-date (today is the end).
function defaultPeriod() {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const iso = (d) => d.toISOString().slice(0, 10);
  return { date_from: iso(first), date_to: iso(now), label: 'This month' };
}

const num = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};

export function useDashboard() {
  const [period, setPeriod] = useState(defaultPeriod());
  const [state, setState] = useState({ loading: true, error: null });
  const [data, setData] = useState(null);

  const load = useCallback(async (p) => {
    setState({ loading: true, error: null });
    const params = { date_from: p.date_from, date_to: p.date_to };
    try {
      // fetch in parallel; tolerate individual failures (esp. audit, which is admin-only)
      const [summary, balances, txns, vouchers, audit] = await Promise.all([
        dashboardAPI.summary(params).catch(() => null),
        dashboardAPI.accountBalances({ date_to: p.date_to }).catch(() => null),
        dashboardAPI.txnSummary(params).catch(() => null),
        dashboardAPI.voucherSummary(params).catch(() => null),
        dashboardAPI.auditTrail({ ...params, limit: 8 }).catch(() => null),
      ]);
      setData({ summary, balances, txns, vouchers, audit });
      setState({ loading: false, error: null });
    } catch (e) {
      setState({ loading: false, error: e.message || 'Failed to load dashboard.' });
    }
  }, []);

  useEffect(() => { load(period); }, [period, load]);

  return {
    period, setPeriod,
    loading: state.loading,
    error: state.error,
    reload: () => load(period),
    ...deriveModel(data),
  };
}

// Turn the raw API payloads into clean view-model pieces the UI renders.
function deriveModel(data) {
  if (!data) return { ready: false };

  const { summary, balances, txns, vouchers, audit } = data;

  // ── hero figures from custom-summary groups [{label,current,prior}] ──
  const g = {};
  (summary?.groups || []).forEach((row) => { g[row.label] = row; });
  const pick = (label) => ({
    current: num(g[label]?.current),
    prior: num(g[label]?.prior),
  });
  const income = pick('Income');
  const expenses = pick('Expenses');
  const net = pick('Net Profit');
  const assets = pick('Total Assets');
  const equity = pick('Total Equity');

  const delta = (cur, prior) => {
    if (!prior) return null;                 // no prior basis → no % shown
    return ((cur - prior) / Math.abs(prior)) * 100;
  };

  const heroes = [
    { key: 'assets',  label: 'Total Assets',   value: assets.current,   delta: delta(assets.current, assets.prior),     icon: 'wallet',  tone: 'teal'  },
    { key: 'equity',  label: 'Total Equity',   value: equity.current,   delta: delta(equity.current, equity.prior),     icon: 'layers',  tone: 'indigo'},
    { key: 'income',  label: 'Income',         value: income.current,   delta: delta(income.current, income.prior),     icon: 'arrow-up',tone: 'green' },
    { key: 'net',     label: net.current < 0 ? 'Net Loss' : 'Net Profit', value: Math.abs(net.current), delta: delta(net.current, net.prior), icon: 'trending', tone: net.current < 0 ? 'red' : 'green', negative: net.current < 0 },
  ];

  // ── income vs expense (for the bar/area chart) ──
  const trend = [
    { name: 'Prior',   Income: income.prior,   Expenses: expenses.prior },
    { name: 'Current', Income: income.current, Expenses: expenses.current },
  ];

  // ── financial position composition (assets vs equity vs liabilities) ──
  const liabilitiesCur = Math.max(assets.current - equity.current, 0); // A = L + E
  const position = [
    { name: 'Assets',      value: assets.current },
    { name: 'Equity',      value: equity.current },
    { name: 'Liabilities', value: liabilitiesCur },
  ].filter((x) => x.value > 0);

  // ── account-type breakdown from balances rows [{type, balance, side}] ──
  const byType = {};
  (balances?.rows || []).forEach((r) => {
    const t = (r.type || 'Other');
    byType[t] = (byType[t] || 0) + num(r.balance);
  });
  const typeBreakdown = Object.entries(byType)
    .map(([name, value]) => ({ name, value }))
    .filter((x) => x.value > 0)
    .sort((a, b) => b.value - a.value);

  // ── voucher counts ──
  const v = vouchers || {};
  const counts = {
    total:    num(v.total_vouchers),
    draft:    num(v.draft_count),
    posted:   num(v.posted_count),
    reversed: num(v.reversed_count),
    recurring:num(v.recurring_count),
    postedAmount: num(v.total_posted_amount),
  };

  // ── recent activity (audit) ──
  const activity = (audit?.rows || []).slice(0, 8);
  const auditAvailable = !!audit;

  // ── balance health ──
  const balanced = balances ? !!balances.balanced : null;

  return {
    ready: true,
    heroes, trend, position, typeBreakdown, counts, activity, auditAvailable, balanced,
    raw: { income, expenses, net, assets, equity },
  };
}
