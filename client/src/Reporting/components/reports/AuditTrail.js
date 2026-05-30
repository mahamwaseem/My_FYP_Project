import React from 'react';
import { ReportSheet, SkeletonRows } from './Parts';
import { prettyDate } from '../../utils/reportHelpers';

const ACTION_CLASS = {
  POSTED: 'a-posted', CREATED: 'a-created', REVERSED: 'a-reversed',
  UPDATED: 'a-updated', DELETED: 'a-deleted',
};

export default function AuditTrail({ data, loading, dateFrom, dateTo }) {
  return (
    <ReportSheet id="rp-printable" kicker="Audit Trail Report"
                 asOf={`${prettyDate(dateFrom)} — ${prettyDate(dateTo)}`}>
      <table className="rp-table">
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Voucher</th>
            <th>Action</th>
            <th>Performed By</th>
            <th>Note</th>
          </tr>
        </thead>
        {(loading || !data) ? <SkeletonRows cols={5} /> : (
          <tbody>
            {data.rows.map((r, i) => (
              <tr key={i} style={{ animationDelay: `${i * 40}ms` }}>
                <td className="num" style={{ textAlign: 'left' }}>{r.ts}</td>
                <td className="acct" style={{ fontFamily: 'var(--mono)', fontSize: '.85rem', fontWeight: 600 }}>{r.voucher}</td>
                <td><span className={`rp-action ${ACTION_CLASS[r.action] || ''}`}>{r.action}</span></td>
                <td>{r.by}</td>
                <td style={{ color: 'var(--ink-soft)' }}>{r.note}</td>
              </tr>
            ))}
          </tbody>
        )}
        {(!loading && data) && (
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