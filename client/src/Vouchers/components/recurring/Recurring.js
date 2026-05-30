import React, { useMemo, useState } from 'react';
import { useRecurring } from '../../hooks/useFinTrack';
import { ErrorBoundary } from '../shared/UI';
import { formatDate, VOUCHER_TYPE_CONFIG } from '../../utils/helpers';
import './Recurring.css';

const FREQ_LABEL = {
  DAILY: 'Daily', WEEKLY: 'Weekly', MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly', YEARLY: 'Yearly',
};

// keyword groups used to categorise a schedule by its voucher text
const CATEGORIES = {
  salary:  { label: 'Salaries',  sub: 'Monthly payroll runs',     icon: 'salary',  words: ['salary', 'salaries', 'payroll', 'wage', 'wages', 'staff'] },
  rent:    { label: 'Rent',      sub: 'Office / premises',         icon: 'rent',    words: ['rent', 'lease', 'premises'] },
  utility: { label: 'Utilities', sub: 'Power · water · internet',  icon: 'utility', words: ['utility', 'utilities', 'electric', 'electricity', 'water', 'internet', 'gas', 'power', 'bill'] },
};

// does a schedule belong to a category? matches voucher_no + narration text
function matchesCategory(item, catKey) {
  const words = CATEGORIES[catKey]?.words || [];
  const hay = `${item.narration || ''} ${item.voucher_no || ''}`.toLowerCase();
  return words.some((w) => hay.includes(w));
}

// classify next-due urgency
function dueClass(dateStr) {
  if (!dateStr) return '';
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const due = new Date(dateStr + 'T00:00:00');
  const days = Math.round((due - today) / 86400000);
  if (days < 0) return 'due';      // overdue
  if (days <= 7) return 'soon';    // within a week
  return '';
}

// quick icon by use-case keyword
const CatIcon = ({ name }) => {
  const paths = {
    salary: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /></>,
    rent:   <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></>,
    utility:<><polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></>,
    repeat: <><polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></>,
  };
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">{paths[name] || paths.repeat}</svg>
  );
};

export default function Recurring() {
  const { items, loading, error, refetch } = useRecurring();
  const [filter, setFilter] = useState(null); // null = All, else 'salary'|'rent'|'utility'

  // counts per category (for the card badges)
  const counts = useMemo(() => {
    const c = { salary: 0, rent: 0, utility: 0 };
    items.forEach((it) => {
      Object.keys(CATEGORIES).forEach((k) => { if (matchesCategory(it, k)) c[k] += 1; });
    });
    return c;
  }, [items]);

  // table rows after applying the active filter
  const visible = useMemo(() => {
    if (!filter) return items;
    return items.filter((it) => matchesCategory(it, filter));
  }, [items, filter]);

  const stats = useMemo(() => {
    const active = items.filter((v) => v.is_active !== false);
    const monthly = items.filter((v) => (v.recurring_frequency || '').toUpperCase() === 'MONTHLY');
    return { total: items.length, active: active.length, monthly: monthly.length };
  }, [items]);

  const toggle = (key) => setFilter((cur) => (cur === key ? null : key));

  return (
    <ErrorBoundary>
      <div className="rec-head">
        <div className="rec-intro">
          <h2>Recurring Transactions</h2>
          <p>
            Schedules that auto-generate regular vouchers — salaries, rent, utilities and other
            repeating payments. Each run posts a balanced voucher on its due date.
          </p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={refetch}>↻ Refresh</button>
      </div>

      {/* use-case filter cards (clickable) */}
      <div className="rec-cat-row">
        {Object.entries(CATEGORIES).map(([key, cat]) => {
          const active = filter === key;
          return (
            <button
              key={key}
              type="button"
              className={`rec-cat${active ? ' active' : ''}`}
              onClick={() => toggle(key)}
              aria-pressed={active}
              title={`Show only ${cat.label.toLowerCase()}`}
            >
              <span className="rec-cat-ic"><CatIcon name={cat.icon} /></span>
              <div className="rec-cat-text">
                <div className="rec-cat-name">{cat.label}</div>
                <div className="rec-cat-sub">{cat.sub}</div>
              </div>
              <span className="rec-cat-count">{counts[key]}</span>
            </button>
          );
        })}
      </div>

      {/* active-filter banner */}
      {filter && (
        <div className="rec-filter-banner">
          Showing <strong>{CATEGORIES[filter].label}</strong> only
          <button className="btn btn-ghost btn-sm" onClick={() => setFilter(null)}>✕ Clear filter</button>
        </div>
      )}

      {/* stats */}
      <div className="rec-stats">
        <div className="rec-stat"><div className="rec-stat-label">Total schedules</div><div className="rec-stat-value">{stats.total}</div></div>
        <div className="rec-stat"><div className="rec-stat-label">Active</div><div className="rec-stat-value accent">{stats.active}</div></div>
        <div className="rec-stat"><div className="rec-stat-label">Monthly</div><div className="rec-stat-value">{stats.monthly}</div></div>
      </div>

      {/* table */}
      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Voucher</th>
              <th>Type</th>
              <th>Frequency</th>
              <th>Next Due</th>
              <th className="amount-cell">Times Run</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>Loading…</td></tr>
            )}
            {!loading && error && (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--color-error)', padding: '24px' }}>
                Couldn’t load recurring schedules.
              </td></tr>
            )}
            {!loading && !error && items.length === 0 && (
              <tr><td colSpan={6}>
                <div className="empty-state" style={{ padding: '34px' }}>
                  <div className="empty-state-icon"><CatIcon name="repeat" /></div>
                  <h3>No recurring transactions yet</h3>
                  <p>Mark a voucher as recurring (e.g. monthly rent or salaries) and it will appear here with its schedule.</p>
                </div>
              </td></tr>
            )}
            {!loading && !error && items.length > 0 && visible.length === 0 && (
              <tr><td colSpan={6}>
                <div className="empty-state" style={{ padding: '30px' }}>
                  <div className="empty-state-icon"><CatIcon name={CATEGORIES[filter]?.icon || 'repeat'} /></div>
                  <h3>No {CATEGORIES[filter]?.label.toLowerCase()} schedules</h3>
                  <p>None of your recurring vouchers match this category. <button className="btn btn-ghost btn-sm" onClick={() => setFilter(null)}>Show all</button></p>
                </div>
              </td></tr>
            )}
            {!loading && !error && visible.map((v) => {
              const freq = (v.recurring_frequency || '').toUpperCase();
              const type = VOUCHER_TYPE_CONFIG[v.v_type] || { label: v.v_type, abbr: v.v_type };
              const next = v.recurring_next_date || v.next_due_date || v.recurring_end_date;
              const paused = v.is_active === false;
              return (
                <tr key={v.id}>
                  <td className="text-mono" style={{ fontWeight: 600 }}>{v.voucher_no || `#${v.id}`}</td>
                  <td><span className={`badge ${type.color || ''}`}>{type.abbr}</span></td>
                  <td><span className="rec-freq">{FREQ_LABEL[freq] || freq || '—'}</span></td>
                  <td className={`rec-next ${dueClass(next)}`}>{next ? formatDate(next) : '—'}</td>
                  <td className="amount-cell text-mono">{v.recurring_times_generated ?? v.times_generated ?? 0}</td>
                  <td>
                    {paused
                      ? <span className="rec-paused">● Paused</span>
                      : <span className="badge status-posted">Active</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </ErrorBoundary>
  );
}