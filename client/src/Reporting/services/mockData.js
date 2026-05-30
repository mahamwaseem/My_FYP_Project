// ============================================================================
// FinTrack — Reporting demo data + report registry
// Defines the 5 reports the module generates, and provides realistic demo
// payloads so the module is fully usable before the backend exists.
// ============================================================================

export const COMPANY = { name: 'Multi Tech Solutions', currency: 'PKR' };

// The report catalogue shown in the left rail.
export const REPORTS = [
  { id: 'balances', no: '01', name: 'Account Balances', icon: 'list',
    desc: 'Every account and its closing balance as of a date.',
    kind: 'financial', needsAccount: false },
  { id: 'txns', no: '02', name: 'Transaction Summary', icon: 'rows',
    desc: 'All postings over a period, totalled by account.',
    kind: 'operational', needsAccount: false },
  { id: 'audit', no: '03', name: 'Audit Trail', icon: 'shield',
    desc: 'Who did what, and when — full traceability.',
    kind: 'operational', needsAccount: false },
  { id: 'account', no: '04', name: 'Account Statement', icon: 'book',
    desc: 'One account, every movement, running balance.',
    kind: 'financial', needsAccount: true },
  { id: 'summary', no: '05', name: 'Custom Summary', icon: 'spark',
    desc: 'Comparative management overview across periods.',
    kind: 'financial', needsAccount: false },
];

export const ACCOUNTS = [
  { id: 1, code: '1001', name: 'Bank Account', type: 'Asset' },
  { id: 2, code: '1002', name: 'Cash in Hand', type: 'Asset' },
  { id: 3, code: '1003', name: 'Accounts Receivable', type: 'Asset' },
  { id: 4, code: '2001', name: 'Accounts Payable', type: 'Liability' },
  { id: 5, code: '3001', name: 'Share Capital', type: 'Equity' },
  { id: 6, code: '4001', name: 'Sales Revenue', type: 'Income' },
  { id: 7, code: '5001', name: 'Rent Expense', type: 'Expense' },
  { id: 8, code: '5002', name: 'Salaries Expense', type: 'Expense' },
  { id: 9, code: '5003', name: 'Utilities Expense', type: 'Expense' },
];

// ── Demo payloads (one per report) ──────────────────────────────────────────

export function demoAccountBalances() {
  const rows = [
    { code: '1001', name: 'Bank Account', type: 'Asset', balance: 257000, side: 'Dr' },
    { code: '1002', name: 'Cash in Hand', type: 'Asset', balance: 0, side: '—' },
    { code: '1003', name: 'Accounts Receivable', type: 'Asset', balance: 0, side: '—' },
    { code: '2001', name: 'Accounts Payable', type: 'Liability', balance: 0, side: '—' },
    { code: '3001', name: 'Share Capital', type: 'Equity', balance: 200000, side: 'Cr' },
    { code: '4001', name: 'Sales Revenue', type: 'Income', balance: 150000, side: 'Cr' },
    { code: '5001', name: 'Rent Expense', type: 'Expense', balance: 35000, side: 'Dr' },
    { code: '5002', name: 'Salaries Expense', type: 'Expense', balance: 50000, side: 'Dr' },
    { code: '5003', name: 'Utilities Expense', type: 'Expense', balance: 8000, side: 'Dr' },
  ];
  const totalDr = 350000, totalCr = 350000;
  return { rows, total_debit: totalDr, total_credit: totalCr, balanced: true };
}

export function demoTransactionSummary() {
  const rows = [
    { code: '1001', name: 'Bank Account', type: 'Asset', debit: 350000, credit: 93000, net: 257000, count: 6 },
    { code: '4001', name: 'Sales Revenue', type: 'Income', debit: 0, credit: 150000, net: -150000, count: 2 },
    { code: '5001', name: 'Rent Expense', type: 'Expense', debit: 35000, credit: 0, net: 35000, count: 1 },
    { code: '5002', name: 'Salaries Expense', type: 'Expense', debit: 50000, credit: 0, net: 50000, count: 1 },
    { code: '5003', name: 'Utilities Expense', type: 'Expense', debit: 8000, credit: 0, net: 8000, count: 1 },
    { code: '3001', name: 'Share Capital', type: 'Equity', debit: 0, credit: 200000, net: -200000, count: 1 },
  ];
  return {
    rows,
    total_debit: rows.reduce((s, r) => s + r.debit, 0),
    total_credit: rows.reduce((s, r) => s + r.credit, 0),
    transaction_count: 11,
    voucher_count: 6,
  };
}

export function demoAuditTrail() {
  const rows = [
    { ts: '2026-05-30 19:05', voucher: 'PV-2026-00003', action: 'POSTED', by: 'System', note: 'Utility Bill' },
    { ts: '2026-05-30 19:04', voucher: 'PV-2026-00002', action: 'POSTED', by: 'System', note: 'Monthly Rent' },
    { ts: '2026-05-30 19:04', voucher: 'PV-2026-00001', action: 'POSTED', by: 'System', note: 'Salary Disbursement' },
    { ts: '2026-05-30 19:04', voucher: 'RV-2026-00001', action: 'POSTED', by: 'System', note: 'Capital Introduced' },
    { ts: '2026-05-29 14:39', voucher: 'JV-2026-00002', action: 'REVERSED', by: 'System', note: 'Reversal issued' },
    { ts: '2026-05-29 14:38', voucher: 'JV-2026-00002', action: 'CREATED', by: 'System', note: 'Draft created' },
  ];
  return { rows, count: rows.length };
}

export function demoAccountStatement(accountName = 'Bank Account') {
  const rows = [
    { date: '2026-05-02', voucher: 'RV-2026-00001', particulars: 'Capital Introduced', debit: 200000, credit: 0, balance: 200000 },
    { date: '2026-05-10', voucher: 'RV-2026-00002', particulars: 'Cash sale', debit: 90000, credit: 0, balance: 290000 },
    { date: '2026-05-12', voucher: 'RV-2026-00003', particulars: 'Service income', debit: 60000, credit: 0, balance: 350000 },
    { date: '2026-05-20', voucher: 'PV-2026-00001', particulars: 'Salary Disbursement', debit: 0, credit: 50000, balance: 300000 },
    { date: '2026-05-22', voucher: 'PV-2026-00002', particulars: 'Monthly Rent', debit: 0, credit: 35000, balance: 265000 },
    { date: '2026-05-25', voucher: 'PV-2026-00003', particulars: 'Utility Bill', debit: 0, credit: 8000, balance: 257000 },
  ];
  return {
    account: accountName, type: 'Asset', opening: 0,
    rows,
    total_debit: rows.reduce((s, r) => s + r.debit, 0),
    total_credit: rows.reduce((s, r) => s + r.credit, 0),
    closing: 257000, closing_side: 'Dr',
  };
}

export function demoCustomSummary() {
  // comparative: current period vs prior
  const groups = [
    { label: 'Income', current: 150000, prior: 90000 },
    { label: 'Expenses', current: 93000, prior: 70000 },
    { label: 'Net Profit', current: 57000, prior: 20000, emphasis: true },
    { label: 'Total Assets', current: 257000, prior: 110000 },
    { label: 'Total Equity', current: 257000, prior: 110000 },
  ];
  return { groups, current_label: 'May 2026', prior_label: 'Apr 2026' };
}
