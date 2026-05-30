// ============================================================================
// FinTrack — General Ledger Utilities
// Reuses the Voucher module's formatting conventions and adds ledger-specific
// logic: running balances, account-type rules, and reconciliation math.
// ============================================================================

// ── XSS Sanitisation (same approach as the voucher module) ───────────────────
const DANGEROUS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi, /on\w+\s*=/gi, /<iframe/gi, /<object/gi,
  /<embed/gi, /data:text\/html/gi, /vbscript:/gi,
];
export function sanitizeString(value) {
  if (typeof value !== 'string') return value;
  let s = value;
  DANGEROUS_PATTERNS.forEach((p) => { s = s.replace(p, ''); });
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
}

// ── Currency / number formatting ─────────────────────────────────────────────
export function formatCurrency(amount, currency = 'PKR', locale = 'en-PK') {
  if (amount === null || amount === undefined || amount === '') return '—';
  const num = parseFloat(amount);
  if (isNaN(num)) return '—';
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2,
    }).format(num);
  } catch {
    return `${currency} ${num.toFixed(2)}`;
  }
}

// Plain grouped number (no currency symbol) — used inside ledger debit/credit columns
export function formatAmount(value) {
  const num = parseFloat(value);
  if (isNaN(num) || num === 0) return '—';
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
}

export function formatDecimal(value, decimals = 2) {
  const num = parseFloat(value);
  if (isNaN(num)) return '0.00';
  return num.toFixed(decimals);
}

// Signed balance: shows Dr / Cr suffix, which is how accountants read a ledger balance
export function formatBalance(value, normalSide = 'DEBIT') {
  const num = parseFloat(value) || 0;
  const abs = Math.abs(num);
  const formatted = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(abs);
  if (abs < 0.005) return '0.00';
  // For a DEBIT-normal account a positive value is Dr; negative is Cr (and vice-versa)
  const isDebitSide = normalSide === 'DEBIT' ? num >= 0 : num < 0;
  return `${formatted} ${isDebitSide ? 'Dr' : 'Cr'}`;
}

// ── Dates ────────────────────────────────────────────────────────────────────
export function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(dateStr));
  } catch { return dateStr; }
}
export function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  try {
    return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(dateStr));
  } catch { return dateStr; }
}
export function toISODate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
}

// ── Account-type configuration ───────────────────────────────────────────────
// normal = the side that increases the account (drives running-balance direction)
export const ACCOUNT_TYPE_CONFIG = {
  ASSET:     { label: 'Asset',     normal: 'DEBIT',  color: '#1d4ed8', bg: '#eff6ff' },
  LIABILITY: { label: 'Liability', normal: 'CREDIT', color: '#b45309', bg: '#fffbeb' },
  EQUITY:    { label: 'Equity',    normal: 'CREDIT', color: '#7c3aed', bg: '#f5f3ff' },
  INCOME:    { label: 'Income',    normal: 'CREDIT', color: '#047857', bg: '#ecfdf5' },
  EXPENSE:   { label: 'Expense',   normal: 'DEBIT',  color: '#be123c', bg: '#fff1f2' },
};

export const VOUCHER_TYPE_CONFIG = {
  PV: { label: 'Payment Voucher', abbr: 'PV', color: 'type-pv' },
  RV: { label: 'Receipt Voucher', abbr: 'RV', color: 'type-rv' },
  JV: { label: 'Journal Voucher', abbr: 'JV', color: 'type-jv' },
  CV: { label: 'Contra Voucher',  abbr: 'CV', color: 'type-cv' },
};

export const POSTING_STATUS_CONFIG = {
  POSTED:  { label: 'Posted',  color: 'status-posted'  },
  PENDING: { label: 'Pending', color: 'status-draft'   },
  FAILED:  { label: 'Failed',  color: 'status-reversed' },
};

// ── Running-balance computation for a detailed account ledger ────────────────
// Given an opening balance and chronological entries, attach a running balance.
// For DEBIT-normal accounts: balance += debit - credit. For CREDIT-normal: inverse.
export function computeRunningBalance(openingBalance, entries, normalSide = 'DEBIT') {
  let balance = parseFloat(openingBalance) || 0;
  const sign = normalSide === 'DEBIT' ? 1 : -1;
  const rows = entries.map((e) => {
    const debit = parseFloat(e.debit) || 0;
    const credit = parseFloat(e.credit) || 0;
    balance += sign * (debit - credit);
    return { ...e, running_balance: balance };
  });
  return { rows, closingBalance: balance };
}

export function computeLedgerTotals(entries = []) {
  let debit = 0, credit = 0;
  entries.forEach((e) => { debit += parseFloat(e.debit) || 0; credit += parseFloat(e.credit) || 0; });
  return { totalDebit: debit, totalCredit: credit };
}

// ── Reconciliation math ──────────────────────────────────────────────────────
// statementBalance: the bank statement closing balance
// clearedLines: ledger lines the user has matched/marked cleared
// The book (ledger) balance reconciles to the statement when:
//   statementBalance === clearedBalance  (difference == 0)
export function computeReconciliation(openingCleared, lines, statementBalance) {
  let clearedDebit = 0, clearedCredit = 0, unclearedDebit = 0, unclearedCredit = 0;
  lines.forEach((l) => {
    const d = parseFloat(l.debit) || 0;
    const c = parseFloat(l.credit) || 0;
    if (l.cleared) { clearedDebit += d; clearedCredit += c; }
    else { unclearedDebit += d; unclearedCredit += c; }
  });
  const clearedBalance = (parseFloat(openingCleared) || 0) + clearedDebit - clearedCredit;
  const difference = (parseFloat(statementBalance) || 0) - clearedBalance;
  return {
    clearedDebit, clearedCredit, unclearedDebit, unclearedCredit,
    clearedBalance, difference,
    isReconciled: Math.abs(difference) < 0.005,
    clearedCount: lines.filter((l) => l.cleared).length,
    unclearedCount: lines.filter((l) => !l.cleared).length,
  };
}

// ── Date-range presets for the advanced transaction search ───────────────────
export function dateRangePreset(key) {
  const today = new Date();
  const iso = (d) => d.toISOString().split('T')[0];
  const start = new Date(today);
  switch (key) {
    case 'this-month':  start.setDate(1); break;
    case 'last-30':     start.setDate(today.getDate() - 30); break;
    case 'last-90':     start.setDate(today.getDate() - 90); break;
    case 'this-year':   start.setMonth(0, 1); break;
    case 'this-quarter':start.setMonth(Math.floor(today.getMonth() / 3) * 3, 1); break;
    default: return { from: '', to: '' };
  }
  return { from: iso(start), to: iso(today) };
}