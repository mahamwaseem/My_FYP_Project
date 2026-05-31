// PKR currency + compact formatting for the dashboard.
export function fmtPKR(value, { compact = false } = {}) {
  const n = parseFloat(value);
  if (!Number.isFinite(n)) return '—';
  if (compact && Math.abs(n) >= 1000) {
    const units = [{ v: 1e9, s: 'B' }, { v: 1e6, s: 'M' }, { v: 1e3, s: 'K' }];
    for (const u of units) {
      if (Math.abs(n) >= u.v) return `Rs ${(n / u.v).toFixed(Math.abs(n / u.v) >= 100 ? 0 : 1)}${u.s}`;
    }
  }
  return `Rs ${n.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function fmtFull(value) {
  const n = parseFloat(value);
  if (!Number.isFinite(n)) return '—';
  return `Rs ${n.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function relTime(ts) {
  if (!ts) return '';
  const then = new Date(ts.replace(' ', 'T'));
  const diff = (Date.now() - then.getTime()) / 1000;
  if (Number.isNaN(diff)) return ts;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return then.toLocaleDateString('en-PK', { day: 'numeric', month: 'short' });
}
