// ============================================================================
// FinTrack — Financial Statements helpers
// Number formatting, accounting negatives, CSV/print export utilities.
// ============================================================================

export const CURRENCY = 'PKR';

export const fmt = (n) =>
  (Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

export const fmtAcct = (n) => {
  const v = Number(n) || 0;
  return v < 0 ? `(${fmt(Math.abs(v))})` : fmt(v);
};

export const todayLabel = () =>
  new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

export function downloadCSV(filename, rows) {
  const csv = rows
    .map((r) => r.map((c) => {
      const s = String(c ?? '');
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    }).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, filename);
}

export function downloadBlob(blob, filename) { triggerDownload(blob, filename); }

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function printElement(elementId, title = 'Financial Statement') {
  const node = document.getElementById(elementId);
  if (!node) { window.print(); return; }
  const win = window.open('', '_blank', 'width=900,height=1000');
  if (!win) { window.print(); return; }
  win.document.write(`<!DOCTYPE html><html><head><title>${title}</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
      body { margin: 32px; font-family: 'Inter', system-ui, sans-serif; color: #0f172a; }
      @media print { @page { margin: 16mm; } }
    </style></head><body>${node.outerHTML}</body></html>`);
  win.document.close(); win.focus();
  setTimeout(() => { win.print(); win.close(); }, 350);
}

export function labelFor(id) {
  return {
    balance: 'Balance Sheet',
    income: 'Income Statement',
    cashflow: 'Cash Flow Statement',
    trial: 'Trial Balance',
  }[id] || 'Financial Statement';
}

export function statementToCSVRows(statementId, data, meta) {
  const blank = ['', ''];
  const rows = [[meta.company, ''], [labelFor(statementId), meta.periodLabel], blank];
  const section = (name, items) => {
    rows.push([name.toUpperCase(), '']);
    items.forEach((r) => rows.push([r.name, r.amount]));
    rows.push(blank);
  };
  if (statementId === 'balance') {
    section('Assets', data.assets); rows.push(['Total Assets', data.total_assets], blank);
    section('Liabilities', data.liabilities); rows.push(['Total Liabilities', data.total_liabilities], blank);
    section('Equity', data.equity); rows.push(['Total Equity', data.total_equity], blank);
    rows.push(['Liabilities + Equity', data.total_liabilities_equity]);
  } else if (statementId === 'income') {
    section('Income', data.income); rows.push(['Total Income', data.total_income], blank);
    section('Expenses', data.expenses); rows.push(['Total Expenses', data.total_expenses], blank);
    rows.push([data.is_profit ? 'Net Profit' : 'Net Loss', data.net_profit]);
  } else if (statementId === 'cashflow') {
    section('Operating Activities', data.operating); rows.push(['Net Operating', data.total_operating], blank);
    section('Investing Activities', data.investing); rows.push(['Net Investing', data.total_investing], blank);
    section('Financing Activities', data.financing); rows.push(['Net Financing', data.total_financing], blank);
    rows.push(['Net Change in Cash', data.net_change], ['Opening Cash', data.opening_cash], ['Closing Cash', data.closing_cash]);
  } else if (statementId === 'trial') {
    rows.push(['Account', 'Debit', 'Credit']);
    data.rows.forEach((r) => rows.push([r.name, r.debit || '', r.credit || '']));
    rows.push(blank, ['Totals', data.total_debit, data.total_credit]);
  }
  return rows;
}
