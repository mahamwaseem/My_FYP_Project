import React from 'react';
import { useSummary, useVouchers } from '../../hooks/useFinTrack';
import { formatCurrency, formatDate, STATUS_CONFIG, VOUCHER_TYPE_CONFIG } from '../../utils/helpers';
import { Skeleton, TableSkeleton, ErrorBoundary } from '../shared/UI';
import './Dashboard.css';

function StatCard({ label, value, sub, icon, color, loading }) {
  return (
    <div className={`stat-card stat-${color}`}>
      <div className="stat-card-top">
        <span className="stat-label">{label}</span>
        <span className="stat-icon">{icon}</span>
      </div>
      {loading ? (
        <Skeleton height="28px" width="60%" style={{ marginTop: '8px' }} />
      ) : (
        <div className="stat-value">{value}</div>
      )}
      {sub && !loading && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

function RecentVouchers({ vouchers, loading, onSelect }) {
  if (loading) return <TableSkeleton rows={4} cols={5} />;
  if (!vouchers.length) return (
    <div className="empty-state" style={{ padding: '30px' }}>
      <div className="empty-state-icon">🗒</div>
      <h3>No vouchers yet</h3>
      <p>Create your first voucher to get started.</p>
    </div>
  );

  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>Voucher No.</th>
          <th>Type</th>
          <th>Date</th>
          <th>Description</th>
          <th>Status</th>
          <th className="amount-cell">Amount</th>
        </tr>
      </thead>
      <tbody>
        {vouchers.map((v) => {
          const typeConf   = VOUCHER_TYPE_CONFIG[v.voucher_type] || {};
          const statusConf = STATUS_CONFIG[v.status] || {};
          return (
            <tr key={v.id} onClick={() => onSelect(v)} style={{ cursor: 'pointer' }}>
              <td className="text-mono">{v.voucher_number}</td>
              <td><span className={`badge ${typeConf.color || ''}`}>{typeConf.abbr || v.voucher_type}</span></td>
              <td>{formatDate(v.voucher_date)}</td>
              <td style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {v.description || '—'}
              </td>
              <td><span className={`badge ${statusConf.color || ''}`}>{statusConf.label || v.status}</span></td>
              <td className="amount-cell">{formatCurrency(v.total_amount, v.currency_code || 'USD')}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export default function Dashboard({ onNavigate, onVoucherSelect }) {
  const { summary, loading: sumLoading } = useSummary();
  const { vouchers, loading: vouchersLoading } = useVouchers({ limit: 8, ordering: '-created_at' });

  const stats = summary || {};

  return (
    <ErrorBoundary>
      <div className="dashboard">
        {/* Stat Cards */}
        <div className="stat-grid">
          <StatCard
            label="Total Revenue"
            value={formatCurrency(stats.total_receipts || 0)}
            sub={`${stats.receipt_count || 0} receipt vouchers`}
            icon="📈" color="teal" loading={sumLoading}
          />
          <StatCard
            label="Total Expenses"
            value={formatCurrency(stats.total_payments || 0)}
            sub={`${stats.payment_count || 0} payment vouchers`}
            icon="📉" color="red" loading={sumLoading}
          />
          <StatCard
            label="Net Balance"
            value={formatCurrency((stats.total_receipts || 0) - (stats.total_payments || 0))}
            sub="Revenue minus expenses"
            icon="⚖" color="blue" loading={sumLoading}
          />
          <StatCard
            label="Pending Draft"
            value={stats.draft_count ?? '—'}
            sub="Vouchers awaiting posting"
            icon="⏳" color="amber" loading={sumLoading}
          />
          <StatCard
            label="Posted"
            value={stats.posted_count ?? '—'}
            sub="Finalised entries"
            icon="✓" color="green" loading={sumLoading}
          />
          <StatCard
            label="Total Vouchers"
            value={stats.total_count ?? '—'}
            sub="All time"
            icon="🗒" color="slate" loading={sumLoading}
          />
        </div>

        {/* Recent Vouchers */}
        <div className="card" style={{ marginTop: '24px' }}>
          <div className="card-header">
            <h2 style={{ fontSize: '0.9375rem', fontWeight: 600 }}>Recent Vouchers</h2>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('vouchers')}>
              View All →
            </button>
          </div>
          <div className="data-table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
            <RecentVouchers
              vouchers={vouchers}
              loading={vouchersLoading}
              onSelect={onVoucherSelect}
            />
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
