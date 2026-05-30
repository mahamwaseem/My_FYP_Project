// ============================================================================
// FinTrack — Financial Statements demo data
// Graceful fallback so the module is demonstrable before the backend exists.
// Figures are MONTHLY scale × period factor. `comparative` adds a prior-year
// figure to each row so the prior-year toggle is fully wired in the demo too.
// ============================================================================

export const COMPANY = { name: 'Multi Tech Solutions', currency: 'PKR' };

export const PERIODS = [
  { id: 'monthly',   label: 'May 2026', factor: 1,    date_from: '2026-05-01', date_to: '2026-05-31' },
  { id: 'quarterly', label: 'Q2 2026',  factor: 2.9,  date_from: '2026-04-01', date_to: '2026-06-30' },
  { id: 'annually',  label: 'FY 2026',  factor: 11.4, date_from: '2026-01-01', date_to: '2026-12-31' },
];

const BASE = {
  assets: [
    { id: 1, code: '1000', name: 'Cash in Hand',           amount: 6800 },
    { id: 2, code: '1010', name: 'Bank — Current Account', amount: 84200 },
    { id: 3, code: '1200', name: 'Accounts Receivable',    amount: 31500 },
    { id: 4, code: '1500', name: 'Office Equipment',       amount: 29600 },
  ],
  liabilities: [
    { id: 5, code: '2000', name: 'Accounts Payable', amount: 26350 },
    { id: 6, code: '2100', name: 'VAT Payable',      amount: 4480 },
  ],
  equity: [
    { id: 7, code: '3000', name: 'Share Capital',     amount: 100000 },
    { id: 8, code: '3100', name: 'Retained Earnings', amount: 21270 },
  ],
  income: [
    { id: 9,  code: '4000', name: 'Sales Revenue',  amount: 142000 },
    { id: 10, code: '4100', name: 'Service Income', amount: 38500 },
  ],
  expenses: [
    { id: 11, code: '5000', name: 'Salaries Expense',  amount: 84400 },
    { id: 12, code: '5100', name: 'Rent Expense',      amount: 19500 },
    { id: 13, code: '5200', name: 'Utilities Expense', amount: 7240 },
    { id: 14, code: '5300', name: 'Depreciation',      amount: 4100 },
  ],
};

const PRIOR = 0.82; // prior-year ≈ 82% of current, for demo comparatives

const scaleRows = (rows, f, comparative) =>
  rows.map((r) => ({
    ...r,
    amount: Math.round(r.amount * f),
    ...(comparative ? { prior: Math.round(r.amount * f * PRIOR) } : {}),
  }));
const sum = (rows, key = 'amount') => rows.reduce((s, r) => s + (r[key] || 0), 0);

export function mockBalanceSheet(factor = 1, comparative = false) {
  const assets = scaleRows(BASE.assets, factor, comparative);
  const liabilities = scaleRows(BASE.liabilities, factor, comparative);
  const equity = scaleRows(BASE.equity, factor, comparative);
  const tA = sum(assets), tL = sum(liabilities), tE = sum(equity);
  return {
    assets, liabilities, equity, comparative,
    total_assets: tA, total_liabilities: tL, total_equity: tE,
    total_liabilities_equity: tL + tE,
    balanced: Math.abs(tA - (tL + tE)) < 1,
    ...(comparative ? {
      prior_total_assets: sum(assets, 'prior'),
      prior_total_liabilities_equity: sum(liabilities, 'prior') + sum(equity, 'prior'),
    } : {}),
  };
}

export function mockIncomeStatement(factor = 1, comparative = false) {
  const income = scaleRows(BASE.income, factor, comparative);
  const expenses = scaleRows(BASE.expenses, factor, comparative);
  const tI = sum(income), tX = sum(expenses), net = tI - tX;
  return {
    income, expenses, comparative,
    total_income: tI, total_expenses: tX, net_profit: net,
    is_profit: net >= 0, margin_pct: tI ? Math.round((net / tI) * 100) : 0,
    ...(comparative ? { prior_net_profit: sum(income, 'prior') - sum(expenses, 'prior') } : {}),
  };
}

export function mockCashFlow(factor = 1, comparative = false) {
  const f = factor;
  const mk = (rows) => comparative ? rows.map((r) => ({ ...r, prior: Math.round(r.amount * PRIOR) })) : rows;
  const operating = mk([
    { name: 'Cash received from customers', amount: Math.round(168000 * f) },
    { name: 'Cash paid to suppliers',       amount: Math.round(-52000 * f) },
    { name: 'Salaries & wages paid',         amount: Math.round(-84400 * f) },
    { name: 'Utilities & rent paid',         amount: Math.round(-26740 * f) },
  ]);
  const investing = mk([{ name: 'Purchase of office equipment', amount: Math.round(-29600 * f) }]);
  const financing = mk([
    { name: 'Capital introduced', amount: Math.round(20000 * f) },
    { name: 'Owner drawings',     amount: Math.round(-6000 * f) },
  ]);
  const t = (rows) => rows.reduce((s, r) => s + r.amount, 0);
  const net = t(operating) + t(investing) + t(financing);
  const opening = Math.round(64000 * f);
  return {
    operating, investing, financing, comparative,
    total_operating: t(operating), total_investing: t(investing), total_financing: t(financing),
    net_change: net, opening_cash: opening, closing_cash: opening + net,
  };
}

export function mockTrialBalance(factor = 1) {
  const bs = mockBalanceSheet(factor);
  const is = mockIncomeStatement(factor);
  const rows = [
    ...bs.assets.map((r) => ({ ...r, type: 'ASSET', debit: r.amount, credit: 0 })),
    ...is.expenses.map((r) => ({ ...r, type: 'EXPENSE', debit: r.amount, credit: 0 })),
    ...bs.liabilities.map((r) => ({ ...r, type: 'LIABILITY', debit: 0, credit: r.amount })),
    ...bs.equity.map((r) => ({ ...r, type: 'EQUITY', debit: 0, credit: r.amount })),
    ...is.income.map((r) => ({ ...r, type: 'INCOME', debit: 0, credit: r.amount })),
  ];
  const td = rows.reduce((s, r) => s + r.debit, 0);
  const tc = rows.reduce((s, r) => s + r.credit, 0);
  return { rows, total_debit: td, total_credit: tc, balanced: Math.abs(td - tc) < 1 };
}

export function mockSummary(factor = 1) {
  const bs = mockBalanceSheet(factor);
  const is = mockIncomeStatement(factor);
  const tb = mockTrialBalance(factor);
  return {
    total_assets: bs.total_assets, net_profit: is.net_profit, is_profit: is.is_profit,
    total_debit: tb.total_debit, total_credit: tb.total_credit, balanced: tb.balanced,
    accounts: tb.rows.length,
  };
}

// status the cards show: Ready when balanced, Draft otherwise (demo heuristic)
export function mockStatuses(factor = 1) {
  const bs = mockBalanceSheet(factor);
  const tb = mockTrialBalance(factor);
  return {
    balance: bs.balanced ? 'Ready' : 'Draft',
    income: 'Ready',
    cashflow: 'Ready',
    trial: tb.balanced ? 'Ready' : 'Draft',
  };
}
