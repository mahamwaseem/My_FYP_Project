import React from 'react';
import { Figure } from './Parts';
import { fmt } from '../../utils/statementHelpers';

export default function TrialBalance({ data }) {
  if (!data) return null;
  const rows = Array.isArray(data.rows) ? data.rows : [];
  const balanced = data.balanced ?? (Math.abs((data.total_debit || 0) - (data.total_credit || 0)) < 1);
  return (
    <div className="fs-statement">
      <div className="fs-tb">
        <div className="fs-tb-head"><span>Account</span><span>Debit</span><span>Credit</span></div>
        {rows.length ? rows.map((r, i) => (
          <div className="fs-tb-row" key={(r.code || r.name) + i} style={{ animationDelay: `${i * 30}ms` }}>
            <span className="fs-tb-name">
              {r.code && <span className="fs-row-code">{r.code}</span>}
              {r.name}
            </span>
            <span className="fs-tb-dr">{r.debit ? fmt(r.debit) : '—'}</span>
            <span className="fs-tb-cr">{r.credit ? fmt(r.credit) : '—'}</span>
          </div>
        )) : (
          <div className="fs-tb-empty">No trial balance rows available.</div>
        )}
        <div className={`fs-tb-total ${balanced ? 'ok' : 'bad'}`}>
          <span>{balanced ? 'In Balance' : 'Out of Balance'}</span>
          <span><Figure value={data.total_debit} /></span>
          <span><Figure value={data.total_credit} /></span>
        </div>
      </div>
    </div>
  );
}
