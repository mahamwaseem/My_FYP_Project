// ============================================================================
// FinTrack — Voucher Templates helpers
// Formatting, the Debit = Credit validation, and turning a template + the
// editable overrides into a concrete voucher payload (audit-ready).
// ============================================================================

export const CURRENCY = 'PKR';

export const fmt = (n) =>
  (Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

export const fmtCur = (n) => `${CURRENCY} ${fmt(n)}`;

export const todayISO = () => new Date().toISOString().slice(0, 10);

export const prettyDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

// Build the concrete voucher lines for a template at a given amount.
// One-debit / one-credit templates: the amount lands on both sides.
export function buildLines(template, amount) {
  const a = Number(amount) || 0;
  return template.lines.map((ln) => ({
    account: ln.account,
    debit:  ln.side === 'debit'  ? a : 0,
    credit: ln.side === 'credit' ? a : 0,
  }));
}

// Validate the entry. Returns { valid, totalDebit, totalCredit, difference, errors[] }.
export function validateEntry(template, { amount, date } = {}) {
  const errors = [];
  const a = Number(amount);
  if (!a || a <= 0) errors.push('Enter an amount greater than zero.');
  if (!date) errors.push('Pick a date for the voucher.');

  const lines = buildLines(template, a || 0);
  const totalDebit = lines.reduce((s, l) => s + l.debit, 0);
  const totalCredit = lines.reduce((s, l) => s + l.credit, 0);
  const difference = Math.abs(totalDebit - totalCredit);
  const balanced = difference < 0.005;
  if (!balanced) errors.push('Debit and Credit must be equal.');

  return { valid: errors.length === 0, balanced, totalDebit, totalCredit, difference, errors, lines };
}

// The payload the apply endpoint expects (and a human summary for the toast).
export function buildApplyPayload(template, { amount, date, description, recurring, frequency }) {
  return {
    template_id: template.id,
    v_type: template.type,
    date,
    description: description || template.name,
    amount: Number(amount) || 0,
    lines: buildLines(template, amount),
    post: true,
    ...(recurring ? { recurring: true, frequency: frequency || template.frequency || 'MONTHLY' } : {}),
  };
}

export const debitAccount  = (t) => (t.lines.find((l) => l.side === 'debit')  || {}).account || '';
export const creditAccount = (t) => (t.lines.find((l) => l.side === 'credit') || {}).account || '';
