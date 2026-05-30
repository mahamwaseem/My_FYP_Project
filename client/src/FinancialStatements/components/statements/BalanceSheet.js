import React from 'react';
import { Section, Figure, ACCENTS } from './Parts';

export default function BalanceSheet({ data, comparative }) {
  if (!data) return null;
  const lePlusEq = data.total_liabilities_equity ?? (data.total_liabilities + data.total_equity);
  const balanced = data.balanced ?? (Math.abs(data.total_assets - lePlusEq) < 1);
  const cmp = comparative && data.comparative;
  return (
    <div className="fs-statement">
      <Section title="Assets" rows={data.assets} total={data.total_assets} accent={ACCENTS.teal} comparative={cmp} />
      <Section title="Liabilities" rows={data.liabilities} total={data.total_liabilities} accent={ACCENTS.slate} comparative={cmp} />
      <Section title="Equity" rows={data.equity} total={data.total_equity} accent={ACCENTS.deep} comparative={cmp} />
      <div className={`fs-balcheck ${balanced ? 'ok' : 'bad'}`}>
        <div className="fs-balcheck-side">
          <span className="fs-balcheck-k">Total Assets</span>
          <span className="fs-balcheck-v"><Figure value={data.total_assets} /></span>
        </div>
        <div className="fs-balcheck-eq">{balanced ? '=' : '≠'}</div>
        <div className="fs-balcheck-side">
          <span className="fs-balcheck-k">Liabilities + Equity</span>
          <span className="fs-balcheck-v"><Figure value={lePlusEq} /></span>
        </div>
      </div>
    </div>
  );
}
