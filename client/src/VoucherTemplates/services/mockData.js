// ============================================================================
// FinTrack — Voucher Templates demo data
// Graceful fallback so the module is fully usable before the backend exists.
// These are realistic, professionally-structured double-entry templates across
// the three voucher types the proposal calls for: Payment, Receipt, Journal.
//
// Each template:
//   • type      'PV' | 'RV' | 'JV'   (Payment / Receipt / Journal)
//   • lines[]   fixed accounts, each tagged side 'debit' | 'credit'
//   • amount    a sensible default (editable at apply time)
//   • editable  which fields the user may change when applying
//   • recurring is it suitable for recurring use (rent, salaries, utilities…)
// At apply time the amount flows onto the debit and credit lines so Dr = Cr
// always holds for these one-debit / one-credit templates.
// ============================================================================

export const COMPANY = { name: 'Multi Tech Solutions', currency: 'PKR' };

// Voucher type metadata (drives colours, labels, filter pills)
export const TYPES = {
  RV: { id: 'RV', label: 'Receipt',  long: 'Receipt Voucher', tone: 'teal',   blurb: 'Money received' },
  PV: { id: 'PV', label: 'Payment',  long: 'Payment Voucher', tone: 'amber',  blurb: 'Money paid out' },
  JV: { id: 'JV', label: 'Journal',  long: 'Journal Voucher', tone: 'violet', blurb: 'Adjustments & accruals' },
};

// Accounts referenced by the templates (resolved against the real COA when live).
export const ACCOUNTS = [
  'Cash in Hand', 'Bank Account', 'Accounts Receivable', 'Accounts Payable',
  'Sales Revenue', 'Service Income', 'Share Capital',
  'Rent Expense', 'Utilities Expense', 'Salaries Expense',
  'Depreciation Expense', 'Accumulated Depreciation',
  'Prepaid Expenses', 'Accrued Liabilities',
];

let _id = 0;
const mk = (t) => ({ id: ++_id, ...t });

export const TEMPLATES = [
  // ── RECEIPT vouchers ──────────────────────────────────────────────
  mk({
    type: 'RV', name: 'Cash Sale',
    description: 'Record a cash sale — cash in, revenue recognised.',
    amount: 10000, recurring: false, tag: 'Sales',
    lines: [
      { account: 'Cash in Hand',  side: 'debit'  },
      { account: 'Sales Revenue', side: 'credit' },
    ],
  }),
  mk({
    type: 'RV', name: 'Customer Payment Received',
    description: 'Customer settles an outstanding invoice into the bank.',
    amount: 25000, recurring: false, tag: 'Receivables',
    lines: [
      { account: 'Bank Account',        side: 'debit'  },
      { account: 'Accounts Receivable', side: 'credit' },
    ],
  }),
  mk({
    type: 'RV', name: 'Capital Introduced',
    description: 'Owner injects capital into the business bank account.',
    amount: 100000, recurring: false, tag: 'Equity',
    lines: [
      { account: 'Bank Account',  side: 'debit'  },
      { account: 'Share Capital', side: 'credit' },
    ],
  }),

  // ── PAYMENT vouchers ──────────────────────────────────────────────
  mk({
    type: 'PV', name: 'Monthly Rent',
    description: 'Pay office rent from the bank. Ideal as a recurring entry.',
    amount: 35000, recurring: true, frequency: 'MONTHLY', tag: 'Overheads',
    lines: [
      { account: 'Rent Expense', side: 'debit'  },
      { account: 'Bank Account', side: 'credit' },
    ],
  }),
  mk({
    type: 'PV', name: 'Utility Bill',
    description: 'Pay electricity / water / internet. Recurring monthly.',
    amount: 8000, recurring: true, frequency: 'MONTHLY', tag: 'Overheads',
    lines: [
      { account: 'Utilities Expense', side: 'debit'  },
      { account: 'Bank Account',      side: 'credit' },
    ],
  }),
  mk({
    type: 'PV', name: 'Salary Disbursement',
    description: 'Pay monthly staff salaries from the bank.',
    amount: 120000, recurring: true, frequency: 'MONTHLY', tag: 'Payroll',
    lines: [
      { account: 'Salaries Expense', side: 'debit'  },
      { account: 'Bank Account',     side: 'credit' },
    ],
  }),
  mk({
    type: 'PV', name: 'Supplier Payment',
    description: 'Settle an outstanding supplier payable from the bank.',
    amount: 40000, recurring: false, tag: 'Payables',
    lines: [
      { account: 'Accounts Payable', side: 'debit'  },
      { account: 'Bank Account',     side: 'credit' },
    ],
  }),

  // ── JOURNAL vouchers ──────────────────────────────────────────────
  mk({
    type: 'JV', name: 'Monthly Depreciation',
    description: 'Charge depreciation on fixed assets. Recurring month-end entry.',
    amount: 5000, recurring: true, frequency: 'MONTHLY', tag: 'Adjustments',
    lines: [
      { account: 'Depreciation Expense',     side: 'debit'  },
      { account: 'Accumulated Depreciation', side: 'credit' },
    ],
  }),
  mk({
    type: 'JV', name: 'Accrued Expense',
    description: 'Recognise an expense incurred but not yet paid.',
    amount: 6000, recurring: false, tag: 'Accruals',
    lines: [
      { account: 'Utilities Expense',  side: 'debit'  },
      { account: 'Accrued Liabilities', side: 'credit' },
    ],
  }),
  mk({
    type: 'JV', name: 'Prepaid Expense Adjustment',
    description: 'Move a prepaid amount into the period it belongs to.',
    amount: 4000, recurring: false, tag: 'Adjustments',
    lines: [
      { account: 'Rent Expense',     side: 'debit'  },
      { account: 'Prepaid Expenses', side: 'credit' },
    ],
  }),
];

// counts for the hero / filter pills
export function templateCounts(items = TEMPLATES) {
  const by = { all: items.length, RV: 0, PV: 0, JV: 0 };
  items.forEach((t) => { by[t.type] = (by[t.type] || 0) + 1; });
  return by;
}
