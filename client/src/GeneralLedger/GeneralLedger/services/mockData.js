// ============================================================================
// FinTrack — General Ledger demo data
// Used ONLY as a graceful fallback so the module is fully demonstrable before
// the backend endpoints exist. Hooks try the real API first; on failure they
// fall back to this seed. Delete `mockData` usage in the hooks to go live-only.
// ============================================================================

export const MOCK_ACCOUNTS = [
  { id: 1, code: '1000', name: 'Cash in Hand',            type: 'ASSET',     currency: 'USD', opening: 5000.00 },
  { id: 2, code: '1010', name: 'Bank — Current Account',  type: 'ASSET',     currency: 'USD', opening: 84200.00 },
  { id: 3, code: '1200', name: 'Accounts Receivable',     type: 'ASSET',     currency: 'USD', opening: 31500.00 },
  { id: 4, code: '1500', name: 'Office Equipment',        type: 'ASSET',     currency: 'USD', opening: 22000.00 },
  { id: 5, code: '2000', name: 'Accounts Payable',        type: 'LIABILITY', currency: 'USD', opening: 18750.00 },
  { id: 6, code: '2100', name: 'VAT Payable',             type: 'LIABILITY', currency: 'USD', opening: 4300.00 },
  { id: 7, code: '3000', name: 'Share Capital',           type: 'EQUITY',    currency: 'USD', opening: 100000.00 },
  { id: 8, code: '4000', name: 'Sales Revenue',           type: 'INCOME',    currency: 'USD', opening: 0.00 },
  { id: 9, code: '5000', name: 'Salaries Expense',        type: 'EXPENSE',   currency: 'USD', opening: 0.00 },
  { id: 10, code: '5100', name: 'Rent Expense',           type: 'EXPENSE',   currency: 'USD', opening: 0.00 },
  { id: 11, code: '5200', name: 'Utilities Expense',      type: 'EXPENSE',   currency: 'USD', opening: 0.00 },
];

// Posted ledger entries (each line of a posted voucher lands here).
// debit/credit are absolute amounts; one of them is 0 per line.
export const MOCK_ENTRIES = [
  { id: 101, account_id: 2,  date: '2026-05-02', voucher_no: 'RV-2026-014', voucher_type: 'RV', narration: 'Customer payment — Acme Corp', reference: 'INV-2098', debit: 12500, credit: 0,     cleared: true },
  { id: 102, account_id: 3,  date: '2026-05-02', voucher_no: 'RV-2026-014', voucher_type: 'RV', narration: 'Customer payment — Acme Corp', reference: 'INV-2098', debit: 0,     credit: 12500, cleared: false },
  { id: 103, account_id: 9,  date: '2026-05-03', voucher_no: 'PV-2026-031', voucher_type: 'PV', narration: 'May payroll run',              reference: 'PAY-05',   debit: 28400, credit: 0,     cleared: false },
  { id: 104, account_id: 2,  date: '2026-05-03', voucher_no: 'PV-2026-031', voucher_type: 'PV', narration: 'May payroll run',              reference: 'PAY-05',   debit: 0,     credit: 28400, cleared: true },
  { id: 105, account_id: 10, date: '2026-05-05', voucher_no: 'PV-2026-032', voucher_type: 'PV', narration: 'Office rent — May',           reference: 'RENT-05',  debit: 6500,  credit: 0,     cleared: false },
  { id: 106, account_id: 2,  date: '2026-05-05', voucher_no: 'PV-2026-032', voucher_type: 'PV', narration: 'Office rent — May',           reference: 'RENT-05',  debit: 0,     credit: 6500,  cleared: true },
  { id: 107, account_id: 1,  date: '2026-05-08', voucher_no: 'RV-2026-015', voucher_type: 'RV', narration: 'Cash sale — walk-in',         reference: 'POS-441',  debit: 1800,  credit: 0,     cleared: false },
  { id: 108, account_id: 8,  date: '2026-05-08', voucher_no: 'RV-2026-015', voucher_type: 'RV', narration: 'Cash sale — walk-in',         reference: 'POS-441',  debit: 0,     credit: 1620,  cleared: false },
  { id: 109, account_id: 6,  date: '2026-05-08', voucher_no: 'RV-2026-015', voucher_type: 'RV', narration: 'VAT on cash sale',            reference: 'POS-441',  debit: 0,     credit: 180,   cleared: false },
  { id: 110, account_id: 11, date: '2026-05-11', voucher_no: 'PV-2026-033', voucher_type: 'PV', narration: 'Electricity — April',        reference: 'UTL-04',   debit: 1240,  credit: 0,     cleared: false },
  { id: 111, account_id: 2,  date: '2026-05-11', voucher_no: 'PV-2026-033', voucher_type: 'PV', narration: 'Electricity — April',        reference: 'UTL-04',   debit: 0,     credit: 1240,  cleared: true },
  { id: 112, account_id: 2,  date: '2026-05-14', voucher_no: 'RV-2026-016', voucher_type: 'RV', narration: 'Customer payment — Beta Ltd', reference: 'INV-2101', debit: 9800,  credit: 0,     cleared: true },
  { id: 113, account_id: 3,  date: '2026-05-14', voucher_no: 'RV-2026-016', voucher_type: 'RV', narration: 'Customer payment — Beta Ltd', reference: 'INV-2101', debit: 0,     credit: 9800,  cleared: false },
  { id: 114, account_id: 5,  date: '2026-05-18', voucher_no: 'JV-2026-009', voucher_type: 'JV', narration: 'Supplier accrual — Gamma',    reference: 'ACR-07',   debit: 0,     credit: 7600,  cleared: false },
  { id: 115, account_id: 4,  date: '2026-05-18', voucher_no: 'JV-2026-009', voucher_type: 'JV', narration: 'Equipment capitalised',       reference: 'ACR-07',   debit: 7600,  credit: 0,     cleared: false },
  { id: 116, account_id: 2,  date: '2026-05-22', voucher_no: 'CV-2026-004', voucher_type: 'CV', narration: 'Cash deposited to bank',      reference: 'DEP-12',   debit: 3000,  credit: 0,     cleared: true },
  { id: 117, account_id: 1,  date: '2026-05-22', voucher_no: 'CV-2026-004', voucher_type: 'CV', narration: 'Cash deposited to bank',      reference: 'DEP-12',   debit: 0,     credit: 3000,  cleared: false },
];

// Vouchers awaiting auto-posting to the ledgers (feature 3 queue).
export const MOCK_POSTING_QUEUE = [
  { id: 5001, voucher_no: 'PV-2026-034', voucher_type: 'PV', date: '2026-05-26', narration: 'Courier & postage', reference: 'EXP-118', total: 430.00,  lines: 2, balanced: true,  status: 'PENDING' },
  { id: 5002, voucher_no: 'RV-2026-017', voucher_type: 'RV', date: '2026-05-27', narration: 'Customer payment — Delta', reference: 'INV-2110', total: 15600.00, lines: 2, balanced: true,  status: 'PENDING' },
  { id: 5003, voucher_no: 'JV-2026-010', voucher_type: 'JV', date: '2026-05-27', narration: 'Depreciation — May', reference: 'DEP-05', total: 1850.00, lines: 2, balanced: true, status: 'PENDING' },
  { id: 5004, voucher_no: 'PV-2026-035', voucher_type: 'PV', date: '2026-05-28', narration: 'Software subscription', reference: 'SUB-22', total: 299.00, lines: 3, balanced: false, status: 'PENDING' },
];

export const MOCK_POSTING_LOG = [
  { id: 9001, voucher_no: 'CV-2026-004', date: '2026-05-22', posted_at: '2026-05-22T14:32:00', posted_by: 'Account User', lines: 2, status: 'POSTED' },
  { id: 9002, voucher_no: 'JV-2026-009', date: '2026-05-18', posted_at: '2026-05-18T11:05:00', posted_by: 'Auto-Post', lines: 2, status: 'POSTED' },
  { id: 9003, voucher_no: 'RV-2026-016', date: '2026-05-14', posted_at: '2026-05-14T09:48:00', posted_by: 'Auto-Post', lines: 2, status: 'POSTED' },
  { id: 9004, voucher_no: 'PV-2026-030', date: '2026-05-01', posted_at: '2026-05-01T16:20:00', posted_by: 'Account User', lines: 4, status: 'FAILED', note: 'Account 5300 inactive' },
];

export const MOCK_RECONCILIATIONS = [
  { id: 1, account_id: 2, account_name: 'Bank — Current Account', period: 'May 2026', statement_balance: 60000.00, opening_cleared: 84200.00, status: 'IN_PROGRESS', created_at: '2026-05-28' },
];
