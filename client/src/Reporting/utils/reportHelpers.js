// ============================================================================
// FinTrack — Reporting helpers
// Formatting, period/date resolution, and export (CSV + print/PDF).
// ============================================================================

export const CURRENCY = 'PKR';

export const fmtMoney = (n) => {
  const v = Number(n);
  if (!isFinite(v)) return '—';
  return v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const fmtMoneyCur = (n) => `${CURRENCY} ${fmtMoney(n)}`;

export const todayISO = () => new Date().toISOString().slice(0, 10);

export const prettyDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso.length <= 10 ? iso + 'T00:00:00' : iso);
  if (isNaN(d)) return iso;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const todayLabel = () =>
  new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

// Resolve a period preset into a {date_from, date_to} pair (current period).
export function resolvePeriod(period, now = new Date()) {
  const y = now.getFullYear();
  const m = now.getMonth();
  const iso = (d) => d.toISOString().slice(0, 10);
  if (period === 'annually') {
    return { date_from: `${y}-01-01`, date_to: `${y}-12-31` };
  }
  if (period === 'quarterly') {
    const q = Math.floor(m / 3);
    const startMonth = q * 3;
    return { date_from: iso(new Date(y, startMonth, 1)), date_to: iso(new Date(y, startMonth + 3, 0)) };
  }
  // monthly (default)
  return { date_from: iso(new Date(y, m, 1)), date_to: iso(new Date(y, m + 1, 0)) };
}

// ── CSV export ──────────────────────────────────────────────────────────────
export function downloadCSV(filename, headerRow, dataRows) {
  const esc = (cell) => {
    const s = String(cell ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headerRow, ...dataRows].map((r) => r.map(esc).join(','));
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Print / PDF (opens a scoped print window with just the report sheet) ─────
export function printElement(elementId, title = 'Report') {
  const el = document.getElementById(elementId);
  if (!el) { window.print(); return; }
  const win = window.open('', '_blank', 'width=900,height=1000');
  if (!win) { window.print(); return; }
  win.document.write(`<!doctype html><html><head><title>${title}</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
      * { box-sizing:border-box; }
      body { font-family:'Inter',sans-serif; color:#0f172a; margin:32px; }
      h1,h2,h3 { font-family:'Sora',sans-serif; }
      table { width:100%; border-collapse:collapse; margin-top:12px; }
      th,td { padding:9px 10px; font-size:12px; text-align:left; border-bottom:1px solid #e7ebf0; }
      th { font-family:'IBM Plex Mono',monospace; font-size:10px; letter-spacing:.08em; text-transform:uppercase; color:#94a3b8; }
      .amt,.num { text-align:right; font-family:'IBM Plex Mono',monospace; }
      tfoot td { border-top:2px solid #0f172a; font-weight:700; }
      .masthead { display:flex; justify-content:space-between; border-bottom:2px solid #0f172a; padding-bottom:12px; }
      .kicker { font-family:'IBM Plex Mono',monospace; font-size:11px; letter-spacing:.18em; text-transform:uppercase; color:#0f766e; }
    </style></head><body>${el.innerHTML}</body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); win.close(); }, 350);
}
