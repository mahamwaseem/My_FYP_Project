import React from 'react';
import { ReportSheet, TypeTag, SkeletonRows } from './Parts';
import { fmtMoney, prettyDate } from '../../utils/reportHelpers';

export default function TransactionSummary({ data, loading, dateFrom, dateTo }) {
  return (
    <ReportSheet id="rp-printable" kicker="Transaction Summary"
                 asOf={`${prettyDate(dateFrom)} — ${prettyDate(dateTo)}`}>
      {(!loading && data) && (
        <div className="rp-statline">
          <span><b>{data.voucher_count}</b> vouchers</span>
          <span><b>{data.transaction_count}</b> postings</span>
        </div>
      )}
      <table className="rp-table">
        <thead>
          <tr>
            <th className="num">Code</th>
            <th>Account</th>
            <th>Type</th>
            <th className="amt">Debit</th>
            <th className="amt">Credit</th>
            <th className="amt">Net</th>
            <th className="num">Entries</th>
          </tr>
        </thead>
        {(loading || !data) ? <SkeletonRows cols={7} /> : (
          <tbody>
            {data.rows.map((r, i) => (
              <tr key={r.code} style={{ animationDelay: `${i * 40}ms` }}>
                <td className="num">{r.code}</td>
                <td className="acct">{r.name}</td>
                <td><TypeTag type={r.type} /></td>
                <td className="amt">{fmtMoney(r.debit)}</td>
                <td className="amt">{fmtMoney(r.credit)}</td>
                <td className={`amt ${r.net < 0 ? 'neg' : ''}`}>{fmtMoney(r.net)}</td>
                <td className="num">{r.count}</td>
              </tr>
            ))}
          </tbody>
        )}
        {(!loading && data) && (
          <tfoot>
            <tr>
              <td colSpan={3}>Totals</td>
              <td className="amt">{fmtMoney(data.total_debit)}</td>
              <td className="amt">{fmtMoney(data.total_credit)}</td>
              <td className="amt"></td>
              <td className="num">{data.transaction_count}</td>
            </tr>
          </tfoot>
        )}
      </table>
    </ReportSheet>
  );
}