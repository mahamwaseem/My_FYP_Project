import React from 'react';
import { ReportSheet, TypeTag, SkeletonRows } from './Parts';
import { fmtMoney, prettyDate } from '../../utils/reportHelpers';

export default function AccountBalances({ data, loading, asOf }) {
  return (
    <ReportSheet id="rp-printable" kicker="Account Balances Report" asOf={`As of ${prettyDate(asOf)}`}>
      <table className="rp-table">
        <thead>
          <tr>
            <th className="num">Code</th>
            <th>Account</th>
            <th>Type</th>
            <th className="amt">Balance</th>
            <th className="side">Dr/Cr</th>
          </tr>
        </thead>
        {(loading || !data || !Array.isArray(data.rows)) ? <SkeletonRows cols={5} /> : (
          <tbody>
            {data.rows.map((r, i) => (
              <tr key={r.code} style={{ animationDelay: `${i * 40}ms` }}>
                <td className="num">{r.code}</td>
                <td className="acct">{r.name}</td>
                <td><TypeTag type={r.type} /></td>
                <td className="amt">{fmtMoney(r.balance)}</td>
                <td className="side">{r.side}</td>
              </tr>
            ))}
          </tbody>
        )}
        {(!loading && data && Array.isArray(data.rows)) && (
          <tfoot>
            <tr>
              <td colSpan={3}>Total Debits · Total Credits</td>
              <td className="amt">{fmtMoney(data.total_debit)}</td>
              <td className={`side ${data.balanced ? 'ok' : 'bad'}`}>{data.balanced ? '=' : '≠'}</td>
            </tr>
          </tfoot>
        )}
      </table>
    </ReportSheet>
  );
}