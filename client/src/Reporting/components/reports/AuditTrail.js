import React from 'react';
import { ReportSheet, SkeletonRows } from './Parts';
import { prettyDate } from '../../utils/reportHelpers';

/* action → colour class (covers all central-audit actions) */
const ACTION_CLASS = {
  posted: 'a-posted', created: 'a-created', reversed: 'a-reversed',
  updated: 'a-updated', deleted: 'a-deleted', applied: 'a-created',
  generated: 'a-created', login: 'a-posted', logout: 'a-deleted',
  login_failed: 'a-reversed', role_changed: 'a-updated', status_changed: 'a-updated',
  POSTED: 'a-posted', CREATED: 'a-created', REVERSED: 'a-reversed',
  UPDATED: 'a-updated', DELETED: 'a-deleted',
};

/* entity type → short label + tone for the badge */
const ENTITY_META = {
  voucher:  { label: 'Voucher',  tone: '#0d9488' },
  account:  { label: 'Account',  tone: '#0ea5e9' },
  group:    { label: 'Group',    tone: '#6366f1' },
  category: { label: 'Category', tone: '#8b5cf6' },
  class:    { label: 'Class',    tone: '#f59e0b' },
  template: { label: 'Template', tone: '#ec4899' },
  currency: { label: 'Currency', tone: '#14b8a6' },
  recurring:{ label: 'Recurring',tone: '#0f766e' },
  user:     { label: 'User',     tone: '#475569' },
  auth:     { label: 'Auth',     tone: '#64748b' },
};

const ROLE_LABEL = { admin: 'Administrator', accountant: 'Accountant', viewer: 'Viewer' };

function EntityBadge({ type }) {
  const m = ENTITY_META[type] || { label: type || '—', tone: '#94a3b8' };
  return (
    <span style={{
      fontFamily: 'var(--mono)', fontSize: '.6rem', letterSpacing: '.05em',
      textTransform: 'uppercase', fontWeight: 700, padding: '2px 8px',
      borderRadius: 999, color: m.tone, background: `${m.tone}14`,
      border: `1px solid ${m.tone}33`,
    }}>{m.label}</span>
  );
}

function Changes({ changes, fallback }) {
  if (!changes || changes.length === 0) {
    return <span style={{ color: 'var(--ink-soft)' }}>{fallback || '—'}</span>;
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {changes.map((c, i) => (
        <div key={i} style={{ fontSize: '.78rem', lineHeight: 1.3 }}>
          <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{c.field}</span>{' '}
          <span style={{ color: '#b91c1c', fontFamily: 'var(--mono)' }}>{c.old == null ? '∅' : c.old}</span>
          <span style={{ color: 'var(--ink-soft)', margin: '0 4px' }}>&rarr;</span>
          <span style={{ color: '#047857', fontFamily: 'var(--mono)' }}>{c.new == null ? '∅' : c.new}</span>
        </div>
      ))}
    </div>
  );
}

export default function AuditTrail({ data, loading, dateFrom, dateTo }) {
  const summary = data && data.summary;

  return (
    <ReportSheet id="rp-printable" kicker="Audit Trail Report"
                 asOf={`${prettyDate(dateFrom)} — ${prettyDate(dateTo)}`}>

      {/* summary strip — counts by action */}
      {!loading && summary && summary.by_action && Object.keys(summary.by_action).length > 0 && (
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14,
          paddingBottom: 14, borderBottom: '1px solid var(--line)',
        }}>
          <span style={{
            fontFamily: 'var(--mono)', fontSize: '.7rem', fontWeight: 700,
            color: 'var(--ink)', alignSelf: 'center', marginRight: 4,
          }}>{summary.total} events</span>
          {Object.entries(summary.by_action).map(([action, n]) => (
            <span key={action} className={`rp-action ${ACTION_CLASS[action] || ''}`}>
              {action.replace(/_/g, ' ')} &middot; {n}
            </span>
          ))}
        </div>
      )}

      <table className="rp-table">
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>User</th>
            <th>Action</th>
            <th>Entity</th>
            <th>What changed</th>
          </tr>
        </thead>
        {(loading || !data || !Array.isArray(data.rows)) ? <SkeletonRows cols={5} /> : (
          <tbody>
            {data.rows.map((r, i) => (
              <tr key={r.id == null ? i : r.id} style={{ animationDelay: `${i * 30}ms` }}>
                <td className="num" style={{ textAlign: 'left', whiteSpace: 'nowrap', fontSize: '.8rem' }}>{r.ts}</td>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.25 }}>
                    <span style={{ fontWeight: 600 }}>{r.actor || 'System'}</span>
                    {r.actor_role && (
                      <span style={{ fontSize: '.7rem', color: 'var(--ink-soft)' }}>
                        {ROLE_LABEL[r.actor_role] || r.actor_role}
                      </span>
                    )}
                  </div>
                </td>
                <td><span className={`rp-action ${ACTION_CLASS[r.action] || ''}`}>
                  {(r.action_label || r.action || '').toString()}
                </span></td>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'flex-start' }}>
                    <EntityBadge type={r.entity_type} />
                    {r.entity && r.entity !== '—' && (
                      <span style={{ fontFamily: 'var(--mono)', fontSize: '.78rem', fontWeight: 600 }}>{r.entity}</span>
                    )}
                  </div>
                </td>
                <td><Changes changes={r.changes} fallback={r.note} /></td>
              </tr>
            ))}
          </tbody>
        )}
        {(!loading && data && Array.isArray(data.rows)) && (
          <tfoot>
            <tr>
              <td colSpan={4}>Total events</td>
              <td className="num" style={{ textAlign: 'left' }}>{data.count}</td>
            </tr>
          </tfoot>
        )}
      </table>
    </ReportSheet>
  );
}