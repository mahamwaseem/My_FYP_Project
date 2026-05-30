import React, { useMemo } from 'react';
import { useAccounts, useTransactions, usePostingQueue, useReconciliations } from '../../hooks/useGeneralLedger';
import { Skeleton, TableSkeleton, ErrorBoundary } from '../shared/UI';
import {
  formatCurrency, formatAmount, ACCOUNT_TYPE_CONFIG, computeRunningBalance,
} from '../../utils/glHelpers';
import './LedgerDashboard.css';

function StatCard({ label, value, sub, icon, color, loading }) {
  return (
    <div className={`stat-card stat-${color}`}>
      <div className="stat-card-top">
        <span className="stat-label">{label}</span>
        <span className="stat-icon" aria-hidden="true">{icon}</span>
      </div>
      {loading
        ? <Skeleton height="30px" width="60%" style={{ marginTop: '8px' }} />
        : <div className="stat-value text-num">{value}</div>}
      {sub && !loading && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

export default function LedgerDashboard({ onNavigate }) {
  const { accounts, loading: accLoading } = useAccounts();
  const { transactions, loading: txLoading } = useTransactions();
  const { queue, loading: pqLoading } = usePostingQueue();
  const { reconciliations } = useReconciliations();

  // Derive a trial balance: closing balance per account from opening + entries.
  const trialBalance = useMemo(() => {
    return accounts.map((acc) => {
      const cfg = ACCOUNT_TYPE_CONFIG[acc.type] || { normal: 'DEBIT' };
      const entries = transactions
        .filter((e) => e.account_id === acc.id)
        .sort((a, b) => a.date.localeCompare(b.date));
      const { closingBalance } = computeRunningBalance(acc.opening || 0, entries, cfg.normal);
      const onDebit = cfg.normal === 'DEBIT' ? closingBalance >= 0 : closingBalance < 0;
      const abs = Math.abs(closingBalance);
      return { ...acc, debit: onDebit ? abs : 0, credit: onDebit ? 0 : abs, normal: cfg.normal };
    });
  }, [accounts, transactions]);

  const totals = useMemo(() => {
    let debit = 0, credit = 0;
    trialBalance.forEach((a) => { debit += a.debit; credit += a.credit; });
    return { debit, credit, balanced: Math.abs(debit - credit) < 0.01 };
  }, [trialBalance]);

  const pendingCount = queue.length;
  const reconInProgress = reconciliations.filter((r) => r.status === 'IN_PROGRESS').length;
  const loading = accLoading || txLoading;

  return (
    <ErrorBoundary>
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">General Ledger Dashboard</h1>
          <p className="page-subtitle">Real-time position across all ledger accounts</p>
        </div>
      </div>

      <div className="stat-grid">
        <StatCard label="Total Debits"  value={formatCurrency(totals.debit)}  sub="Across all accounts" icon="▲" color="blue"  loading={loading} />
        <StatCard label="Total Credits" value={formatCurrency(totals.credit)} sub="Across all accounts" icon="▼" color="amber" loading={loading} />
        <StatCard
          label="Ledger Status"
          value={totals.balanced ? 'In Balance' : 'Out of Balance'}
          sub={totals.balanced ? 'Debits equal credits' : `Diff ${formatAmount(Math.abs(totals.debit - totals.credit))}`}
          icon="⚖" color={totals.balanced ? 'green' : 'red'} loading={loading}
        />
        <StatCard label="Active Accounts" value={accounts.length} sub="With ledger activity" icon="📒" color="teal" loading={accLoading} />
        <StatCard label="Pending Posting" value={pendingCount} sub="Awaiting auto-post" icon="↳" color="amber" loading={pqLoading} />
        <StatCard label="Reconciliations" value={reconInProgress} sub="In progress" icon="🔗" color="slate" loading={false} />
      </div>

      <div className="card" style={{ marginTop: '24px' }}>
        <div className="card-header">
          <h2 style={{ fontSize: '1.05em', fontWeight: 600 }}>Trial Balance Snapshot</h2>
          <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('ledger')}>Open Ledger →</button>
        </div>
        <div className="data-table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
          {loading ? <TableSkeleton rows={6} cols={4} /> : (
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '90px' }}>Code</th>
                  <th>Account</th>
                  <th>Type</th>
                  <th className="amount-cell">Debit</th>
                  <th className="amount-cell">Credit</th>
                </tr>
              </thead>
              <tbody>
                {trialBalance.map((a) => {
                  const cfg = ACCOUNT_TYPE_CONFIG[a.type] || {};
                  return (
                    <tr key={a.id} onClick={() => onNavigate('ledger', a.id)} style={{ cursor: 'pointer' }}>
                      <td className="text-mono">{a.code}</td>
                      <td style={{ fontWeight: 500 }}>{a.name}</td>
                      <td>
                        <span className="type-pill" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                      </td>
                      <td className="amount-cell debit-cell">{a.debit ? formatAmount(a.debit) : '—'}</td>
                      <td className="amount-cell credit-cell">{a.credit ? formatAmount(a.credit) : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} style={{ textAlign: 'right' }}>Totals</td>
                  <td className="amount-cell debit-cell">{formatAmount(totals.debit)}</td>
                  <td className="amount-cell credit-cell">{formatAmount(totals.credit)}</td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}
