import React, { useState, useMemo } from 'react';
import { useAccounts, useTransactions, useToast } from '../../hooks/useGeneralLedger';
import { TableSkeleton, ErrorBoundary, Pagination } from '../shared/UI';
import {
  formatAmount, formatDate, VOUCHER_TYPE_CONFIG, dateRangePreset,
} from '../../utils/glHelpers';
import './TransactionSearch.css';

const PAGE_SIZE = 15;
const EMPTY = { q: '', account: '', type: '', from: '', to: '', min_amount: '', max_amount: '', side: '' };

export default function TransactionSearch() {
  const { accounts } = useAccounts();
  const { transactions, loading, search } = useTransactions();
  const toast = useToast();

  const [draft, setDraft] = useState(EMPTY);     // form state
  const [applied, setApplied] = useState(EMPTY); // last-run filters (for the count line)
  const [sortField, setSortField] = useState('date');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(1);

  const accountName = (id) => {
    const a = accounts.find((x) => x.id === Number(id));
    return a ? `${a.code} — ${a.name}` : '—';
  };

  const activeFilterCount = Object.values(applied).filter((v) => v !== '').length;

  const update = (k, v) => setDraft((d) => ({ ...d, [k]: v }));
  const runSearch = () => { search(draft); setApplied(draft); setPage(1); };
  const reset = () => { setDraft(EMPTY); setApplied(EMPTY); search({}); setPage(1); };
  const applyPreset = (key) => {
    const r = dateRangePreset(key);
    const next = { ...draft, ...r };
    setDraft(next); search(next); setApplied(next); setPage(1);
  };

  const sorted = useMemo(() => {
    const data = [...transactions];
    data.sort((a, b) => {
      let va = a[sortField], vb = b[sortField];
      if (sortField === 'amount') { va = Math.max(a.debit, a.credit); vb = Math.max(b.debit, b.credit); }
      if (typeof va === 'number') return sortDir === 'asc' ? va - vb : vb - va;
      return sortDir === 'asc'
        ? String(va ?? '').localeCompare(String(vb ?? ''), undefined, { numeric: true })
        : String(vb ?? '').localeCompare(String(va ?? ''), undefined, { numeric: true });
    });
    return data;
  }, [transactions, sortField, sortDir]);

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSort = (f) => {
    if (sortField === f) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(f); setSortDir('asc'); }
  };
  const SortIcon = ({ field }) => sortField !== field
    ? <span style={{ opacity: 0.3 }}> ⇅</span>
    : <span> {sortDir === 'asc' ? '↑' : '↓'}</span>;

  const handleExport = () => {
    const header = ['Date', 'Voucher', 'Type', 'Account', 'Particulars', 'Reference', 'Debit', 'Credit'];
    const rows = sorted.map((e) => [
      e.date, e.voucher_no, e.voucher_type, accountName(e.account_id),
      `"${(e.narration || '').replace(/"/g, '""')}"`, e.reference || '',
      e.debit || 0, e.credit || 0,
    ]);
    const csv = [header, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `gl-transactions-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${sorted.length} transactions to CSV.`, 'Export complete');
  };

  return (
    <ErrorBoundary>
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">Transaction Search</h1>
          <p className="page-subtitle">Search and filter every historical ledger transaction</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={handleExport} disabled={!sorted.length}>⭳ Export CSV</button>
        </div>
      </div>

      {/* ── Filter panel ── */}
      <div className="card search-panel">
        <div className="search-grid">
          <div className="form-group search-q">
            <label className="form-label" htmlFor="ts-q">Keyword</label>
            <input id="ts-q" className="form-control" placeholder="Voucher no, particulars or reference…"
              value={draft.q} onChange={(e) => update('q', e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && runSearch()} />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="ts-acc">Account</label>
            <select id="ts-acc" className="form-control" value={draft.account} onChange={(e) => update('account', e.target.value)}>
              <option value="">All accounts</option>
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.code} — {a.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="ts-type">Voucher type</label>
            <select id="ts-type" className="form-control" value={draft.type} onChange={(e) => update('type', e.target.value)}>
              <option value="">All types</option>
              {Object.entries(VOUCHER_TYPE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="ts-side">Side</label>
            <select id="ts-side" className="form-control" value={draft.side} onChange={(e) => update('side', e.target.value)}>
              <option value="">Debit &amp; Credit</option>
              <option value="debit">Debit only</option>
              <option value="credit">Credit only</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="ts-from">Date from</label>
            <input id="ts-from" type="date" className="form-control" value={draft.from} onChange={(e) => update('from', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="ts-to">Date to</label>
            <input id="ts-to" type="date" className="form-control" value={draft.to} onChange={(e) => update('to', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="ts-min">Min amount</label>
            <input id="ts-min" type="number" min="0" step="0.01" className="form-control" placeholder="0.00"
              value={draft.min_amount} onChange={(e) => update('min_amount', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="ts-max">Max amount</label>
            <input id="ts-max" type="number" min="0" step="0.01" className="form-control" placeholder="0.00"
              value={draft.max_amount} onChange={(e) => update('max_amount', e.target.value)} />
          </div>
        </div>

        <div className="search-footer">
          <div className="search-presets">
            <span className="search-presets-label">Quick range:</span>
            <button className="btn btn-ghost btn-sm" onClick={() => applyPreset('last-30')}>Last 30 days</button>
            <button className="btn btn-ghost btn-sm" onClick={() => applyPreset('last-90')}>Last 90 days</button>
            <button className="btn btn-ghost btn-sm" onClick={() => applyPreset('this-year')}>This year</button>
          </div>
          <div className="search-actions">
            <button className="btn btn-ghost" onClick={reset}>Reset</button>
            <button className="btn btn-primary" onClick={runSearch}>🔎 Search</button>
          </div>
        </div>
      </div>

      {/* ── Results ── */}
      <div className="results-meta">
        {loading ? '…' : `${sorted.length} transaction${sorted.length !== 1 ? 's' : ''}`}
        {activeFilterCount > 0 && <span className="filter-chip">{activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} applied</span>}
      </div>

      <div className="data-table-wrapper">
        {loading ? <TableSkeleton rows={8} cols={7} /> : paginated.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔎</div>
            <h3>No matching transactions</h3>
            <p>Adjust your filters and search again.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th className="sortable" onClick={() => handleSort('date')}>Date<SortIcon field="date" /></th>
                <th className="sortable" onClick={() => handleSort('voucher_no')}>Voucher<SortIcon field="voucher_no" /></th>
                <th>Account</th>
                <th>Particulars</th>
                <th>Reference</th>
                <th className="sortable amount-cell" onClick={() => handleSort('amount')}>Amount<SortIcon field="amount" /></th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((e) => {
                const vt = VOUCHER_TYPE_CONFIG[e.voucher_type] || {};
                const isDebit = e.debit > 0;
                return (
                  <tr key={e.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatDate(e.date)}</td>
                    <td>
                      <span className="text-mono" style={{ color: 'var(--teal-700)', fontWeight: 500 }}>{e.voucher_no}</span>{' '}
                      <span className={`badge ${vt.color || ''}`}>{vt.abbr || e.voucher_type}</span>
                    </td>
                    <td style={{ fontWeight: 500 }}>{accountName(e.account_id)}</td>
                    <td className="particulars-cell">{e.narration || '—'}</td>
                    <td className="text-mono" style={{ color: 'var(--text-muted)', fontSize: '0.9em' }}>{e.reference || '—'}</td>
                    <td className={`amount-cell ${isDebit ? 'debit-cell' : 'credit-cell'}`}>
                      {formatAmount(isDebit ? e.debit : e.credit)}
                      <span className="dc-tag">{isDebit ? 'Dr' : 'Cr'}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </ErrorBoundary>
  );
}
