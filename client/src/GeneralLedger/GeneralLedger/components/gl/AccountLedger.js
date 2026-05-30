import React, { useState, useMemo } from 'react';
import { useAccounts, useAccountLedger } from '../../hooks/useGeneralLedger';
import { TableSkeleton, ErrorBoundary } from '../shared/UI';
import {
  formatAmount, formatBalance, formatDate, formatCurrency,
  ACCOUNT_TYPE_CONFIG, VOUCHER_TYPE_CONFIG,
  computeRunningBalance, computeLedgerTotals, dateRangePreset,
} from '../../utils/glHelpers';
import './AccountLedger.css';

export default function AccountLedger({ initialAccountId }) {
  const { accounts, loading: accLoading } = useAccounts();
  const [accountId, setAccountId] = useState(initialAccountId || '');
  const [range, setRange] = useState({ from: '', to: '' });

  // Pick a sensible default account once the list loads.
  const effectiveId = accountId || (accounts[0] && accounts[0].id) || '';
  const { entries, loading } = useAccountLedger(effectiveId, range);
  const account = accounts.find((a) => String(a.id) === String(effectiveId));
  const cfg = account ? (ACCOUNT_TYPE_CONFIG[account.type] || {}) : {};

  // Filter by date range, sort chronologically, then attach running balance.
  const ledger = useMemo(() => {
    let data = [...entries];
    if (range.from) data = data.filter((e) => e.date >= range.from);
    if (range.to)   data = data.filter((e) => e.date <= range.to);
    data.sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id);
    const { rows, closingBalance } = computeRunningBalance(account?.opening || 0, data, cfg.normal || 'DEBIT');
    const { totalDebit, totalCredit } = computeLedgerTotals(data);
    return { rows, closingBalance, totalDebit, totalCredit };
  }, [entries, range, account, cfg.normal]);

  const setPreset = (key) => setRange(dateRangePreset(key));

  return (
    <ErrorBoundary>
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">Account Ledger</h1>
          <p className="page-subtitle">Every debit and credit posted to an account, with a running balance</p>
        </div>
      </div>

      {/* ── Controls ── */}
      <div className="ledger-controls card">
        <div className="form-group ledger-account-picker">
          <label className="form-label" htmlFor="ledger-account">Account</label>
          <select
            id="ledger-account" className="form-control"
            value={effectiveId} onChange={(e) => setAccountId(e.target.value)} disabled={accLoading}
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="ledger-from">From</label>
          <input id="ledger-from" type="date" className="form-control"
            value={range.from} onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))} />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="ledger-to">To</label>
          <input id="ledger-to" type="date" className="form-control"
            value={range.to} onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))} />
        </div>
        <div className="ledger-presets">
          <button className="btn btn-ghost btn-sm" onClick={() => setPreset('this-month')}>This month</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setPreset('this-quarter')}>This quarter</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setPreset('this-year')}>This year</button>
          {(range.from || range.to) && (
            <button className="btn btn-ghost btn-sm" onClick={() => setRange({ from: '', to: '' })}>Clear</button>
          )}
        </div>
      </div>

      {/* ── Account summary ── */}
      {account && (
        <div className="ledger-summary">
          <div className="ledger-summary-head">
            <div>
              <div className="ledger-acc-code text-mono">{account.code}</div>
              <div className="ledger-acc-name">{account.name}</div>
            </div>
            <span className="type-pill" style={{ background: cfg.bg, color: cfg.color }}>
              {cfg.label} · {cfg.normal === 'DEBIT' ? 'Debit' : 'Credit'} balance
            </span>
          </div>
          <div className="ledger-summary-stats">
            <div className="lss-item">
              <span className="lss-label">Opening Balance</span>
              <span className="lss-value text-num">{formatBalance(account.opening || 0, cfg.normal)}</span>
            </div>
            <div className="lss-item">
              <span className="lss-label">Total Debits</span>
              <span className="lss-value text-num debit-cell">{formatAmount(ledger.totalDebit) === '—' ? '0.00' : formatAmount(ledger.totalDebit)}</span>
            </div>
            <div className="lss-item">
              <span className="lss-label">Total Credits</span>
              <span className="lss-value text-num credit-cell">{formatAmount(ledger.totalCredit) === '—' ? '0.00' : formatAmount(ledger.totalCredit)}</span>
            </div>
            <div className="lss-item lss-closing">
              <span className="lss-label">Closing Balance</span>
              <span className="lss-value text-num">{formatBalance(ledger.closingBalance, cfg.normal)}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Ledger table ── */}
      <div className="data-table-wrapper" style={{ marginTop: '16px' }}>
        {loading ? <TableSkeleton rows={8} cols={7} /> : (
          <table className="data-table ledger-table">
            <thead>
              <tr>
                <th style={{ width: '110px' }}>Date</th>
                <th>Voucher</th>
                <th>Particulars</th>
                <th>Reference</th>
                <th className="amount-cell">Debit</th>
                <th className="amount-cell">Credit</th>
                <th className="amount-cell">Balance</th>
              </tr>
            </thead>
            <tbody>
              <tr className="opening-row">
                <td>{range.from ? formatDate(range.from) : '—'}</td>
                <td colSpan={3}><em>Opening balance brought forward</em></td>
                <td className="amount-cell">—</td>
                <td className="amount-cell">—</td>
                <td className="amount-cell balance-figure">{formatBalance(account?.opening || 0, cfg.normal)}</td>
              </tr>
              {ledger.rows.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-state" style={{ padding: '40px' }}>
                      <div className="empty-state-icon">📒</div>
                      <h3>No movements in this period</h3>
                      <p>Try widening the date range or selecting another account.</p>
                    </div>
                  </td>
                </tr>
              ) : ledger.rows.map((e) => {
                const vt = VOUCHER_TYPE_CONFIG[e.voucher_type] || {};
                return (
                  <tr key={e.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatDate(e.date)}</td>
                    <td>
                      <span className="ledger-voucher-no text-mono">{e.voucher_no}</span>{' '}
                      <span className={`badge ${vt.color || ''}`}>{vt.abbr || e.voucher_type}</span>
                    </td>
                    <td className="particulars">{e.narration || '—'}</td>
                    <td className="text-mono ref-cell">{e.reference || '—'}</td>
                    <td className="amount-cell debit-cell">{formatAmount(e.debit)}</td>
                    <td className="amount-cell credit-cell">{formatAmount(e.credit)}</td>
                    <td className="amount-cell balance-figure">{formatBalance(e.running_balance, cfg.normal)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={4} style={{ textAlign: 'right' }}>Period Totals</td>
                <td className="amount-cell debit-cell">{formatAmount(ledger.totalDebit) === '—' ? '0.00' : formatAmount(ledger.totalDebit)}</td>
                <td className="amount-cell credit-cell">{formatAmount(ledger.totalCredit) === '—' ? '0.00' : formatAmount(ledger.totalCredit)}</td>
                <td className="amount-cell balance-figure">{formatBalance(ledger.closingBalance, cfg.normal)}</td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </ErrorBoundary>
  );
}
