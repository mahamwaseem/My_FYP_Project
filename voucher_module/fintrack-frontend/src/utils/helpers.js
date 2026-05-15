// FinTrack Security & Validation Utilities

// ── XSS Sanitization ─────────────────────────────────────────────────────────
const DANGEROUS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<iframe/gi,
  /<object/gi,
  /<embed/gi,
  /data:text\/html/gi,
  /vbscript:/gi,
];

export function sanitizeString(value) {
  if (typeof value !== 'string') return value;
  let sanitized = value;
  DANGEROUS_PATTERNS.forEach((pattern) => {
    sanitized = sanitized.replace(pattern, '');
  });
  // HTML encode remaining special chars
  return sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

export function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const clean = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const val = obj[key];
      if (typeof val === 'string') {
        clean[key] = sanitizeString(val);
      } else if (Array.isArray(val)) {
        clean[key] = val.map((item) =>
          typeof item === 'object' ? sanitizeObject(item) : sanitizeString(item)
        );
      } else if (typeof val === 'object' && val !== null) {
        clean[key] = sanitizeObject(val);
      } else {
        clean[key] = val;
      }
    }
  }
  return clean;
}

// ── Currency / Decimal Formatting ────────────────────────────────────────────
export function formatCurrency(amount, currency = 'USD', locale = 'en-US') {
  if (amount === null || amount === undefined || amount === '') return '—';
  const num = parseFloat(amount);
  if (isNaN(num)) return '—';
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  } catch {
    return `${currency} ${num.toFixed(2)}`;
  }
}

export function formatDecimal(value, decimals = 2) {
  const num = parseFloat(value);
  if (isNaN(num)) return '0.00';
  return num.toFixed(decimals);
}

// ── Date Formatting ───────────────────────────────────────────────────────────
export function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  try {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

export function toISODate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
}

// ── Voucher Validation ────────────────────────────────────────────────────────
export function validateVoucherLines(lines) {
  const errors = [];
  if (!lines || lines.length < 2) {
    errors.push('At least two lines (one debit, one credit) are required.');
    return errors;
  }

  let totalDebit = 0;
  let totalCredit = 0;

  lines.forEach((line, i) => {
    const debit = parseFloat(line.debit_amount) || 0;
    const credit = parseFloat(line.credit_amount) || 0;

    if (!line.account_id) {
      errors.push(`Line ${i + 1}: Account is required.`);
    }
    if (debit === 0 && credit === 0) {
      errors.push(`Line ${i + 1}: Either Debit or Credit must be non-zero.`);
    }
    if (debit > 0 && credit > 0) {
      errors.push(`Line ${i + 1}: A line cannot have both Debit and Credit.`);
    }
    totalDebit += debit;
    totalCredit += credit;
  });

  const diff = Math.abs(totalDebit - totalCredit);
  if (diff > 0.001) {
    errors.push(
      `Debit (${formatDecimal(totalDebit)}) ≠ Credit (${formatDecimal(totalCredit)}). Difference: ${formatDecimal(diff)}`
    );
  }

  return errors;
}

export function computeTotals(lines = []) {
  let totalDebit = 0;
  let totalCredit = 0;
  lines.forEach((line) => {
    totalDebit += parseFloat(line.debit_amount) || 0;
    totalCredit += parseFloat(line.credit_amount) || 0;
  });
  return { totalDebit, totalCredit, balanced: Math.abs(totalDebit - totalCredit) < 0.001 };
}

// ── Status Badge Config ───────────────────────────────────────────────────────
export const STATUS_CONFIG = {
  DRAFT:     { label: 'Draft',     color: 'status-draft'    },
  POSTED:    { label: 'Posted',    color: 'status-posted'   },
  REVERSED:  { label: 'Reversed',  color: 'status-reversed' },
};

export const VOUCHER_TYPE_CONFIG = {
  PV: { label: 'Payment Voucher',  abbr: 'PV', color: 'type-pv' },
  RV: { label: 'Receipt Voucher',  abbr: 'RV', color: 'type-rv' },
  JV: { label: 'Journal Voucher',  abbr: 'JV', color: 'type-jv' },
};
