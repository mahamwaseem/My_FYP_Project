import React from 'react';
import { ReportSheet } from './Parts';
import { fmtMoney } from '../../utils/reportHelpers';

export default function CustomSummary({ data, loading, asOf }) {
  return (
    <ReportSheet id="rp-printable" kicker="Custom Management Summary" asOf={asOf}>
      {loading ? (
        <div className="rp-summary-grid">
          {[...Array(5)].map((_, i) => <span className="rp-skel" key={i} style={{ height: 64, animationDelay: `${i * 60}ms` }} />)}
        </div>
      ) : (
        <>
          <table className="rp-table rp-compare">
            <thead>
              <tr>
                <th>Metric</th>
                <th className="amt">{data.current_label}</th>
                <th className="amt">{data.prior_label}</th>
                <th className="amt">Change</th>
                <th className="amt">%</th>
              </tr>
            </thead>
            <tbody>
              {data.groups.map((g, i) => {
                const change = g.current - g.prior;
                const pct = g.prior ? ((change / Math.abs(g.prior)) * 100) : 0;
                return (
                  <tr key={g.label} className={g.emphasis ? 'rp-emphasis' : ''} style={{ animationDelay: `${i * 50}ms` }}>
                    <td className="acct">{g.label}</td>
                    <td className="amt">{fmtMoney(g.current)}</td>
                    <td className="amt" style={{ color: 'var(--faint)' }}>{fmtMoney(g.prior)}</td>
                    <td className={`amt ${change < 0 ? 'neg' : 'pos'}`}>{change >= 0 ? '+' : ''}{fmtMoney(change)}</td>
                    <td className={`amt ${change < 0 ? 'neg' : 'pos'}`}>{change >= 0 ? '▲' : '▼'} {Math.abs(pct).toFixed(1)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="rp-summary-note">
            Comparative figures contrast the selected period against the prior equivalent period,
            highlighting movement for management review.
          </p>
        </>
      )}
    </ReportSheet>
  );
}
