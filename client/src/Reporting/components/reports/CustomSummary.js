import React from 'react';
import { ReportSheet } from './Parts';
import { fmtMoney } from '../../utils/reportHelpers';

export default function CustomSummary({ data, loading, asOf }) {
  return (
    <ReportSheet id="rp-printable" kicker="Custom Management Summary" asOf={asOf}>
      {loading || !data || !Array.isArray(data.groups) ? (
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
                const cur = Number(g.current) || 0;
                const prior = Number(g.prior) || 0;
                const change = cur - prior;
                const hasPrior = Math.abs(prior) > 0.005;
                const pct = hasPrior ? (change / Math.abs(prior)) * 100 : null;
                const pctLabel = pct === null
                  ? (Math.abs(change) > 0.005 ? 'New' : '—')
                  : `${change >= 0 ? '▲' : '▼'} ${Math.abs(pct).toFixed(1)}%`;
                return (
                  <tr key={g.label} className={g.emphasis ? 'rp-emphasis' : ''} style={{ animationDelay: `${i * 50}ms` }}>
                    <td className="acct">{g.label}</td>
                    <td className="amt">{fmtMoney(g.current)}</td>
                    <td className="amt" style={{ color: 'var(--faint)' }}>{fmtMoney(g.prior)}</td>
                    <td className={`amt ${change < 0 ? 'neg' : 'pos'}`}>{change >= 0 ? '+' : ''}{fmtMoney(change)}</td>
                    <td className={`amt ${pct === null ? '' : (change < 0 ? 'neg' : 'pos')}`}>{pctLabel}</td>
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