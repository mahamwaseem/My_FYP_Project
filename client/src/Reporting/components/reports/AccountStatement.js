import React from 'react';
import { ReportSheet, SkeletonRows } from './Parts';
import { fmtMoney, prettyDate } from '../../utils/reportHelpers';

export default function AccountStatement({ data, loading, dateFrom, dateTo }) {
  return (
    <ReportSheet id="rp-printable"
                 kicker={`Account Statement · ${loading ? '' : data.account}`}
                 asOf={`${prettyDate(dateFrom)} — ${prettyDate(dateTo)}`}>
      <table className="rp-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Voucher</th>
            <th>Particulars</th>
            <th className="amt">Debit</th>
            <th className="amt">Credit</th>
            <th className="amt">Balance</th>
          </tr>
        </thead>
        {(loading || !data || !Array.isArray(data.rows)) ? <SkeletonRows cols={6} /> : (
          <tbody>
            <tr className="rp-opening">
              <td colSpan={5}>Opening balance brought forward</td>
              <td className="amt">{fmtMoney(data.opening)}</td>
            </tr>
            {data.rows.map((r, i) => (
              <tr key={i} style={{ animationDelay: `${i * 40}ms` }}>
                <td className="num" style={{ textAlign: 'left' }}>{prettyDate(r.date)}</td>
                <td style={{ fontFamily: 'var(--mono)', fontSize: '.82rem', fontWeight: 600 }}>{r.voucher}</td>
                <td className="acct" style={{ fontWeight: 500 }}>{r.particulars}</td>
                <td className="amt">{r.debit ? fmtMoney(r.debit) : '—'}</td>
                <td className="amt">{r.credit ? fmtMoney(r.credit) : '—'}</td>
                <td className="amt" style={{ fontWeight: 600 }}>{fmtMoney(r.balance)}</td>
              </tr>
            ))}
          </tbody>
        )}
        {(!loading && data && Array.isArray(data.rows)) && (
          <tfoot>
            <tr>
              <td colSpan={3}>Closing balance</td>
              <td className="amt">{fmtMoney(data.total_debit)}</td>
              <td className="amt">{fmtMoney(data.total_credit)}</td>
              <td className="amt">{fmtMoney(data.closing)} <span className="rp-cside">{data.closing_side}</span></td>
            </tr>
          </tfoot>
        )}
      </table>
    </ReportSheet>
  );
}