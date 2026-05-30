import React from 'react';
import { Section, Figure, ACCENTS } from './Parts';

export default function CashFlow({ data, comparative }) {
  if (!data) return null;
  const cmp = comparative && data.comparative;
  return (
    <div className="fs-statement">
      <Section title="Operating Activities" rows={data.operating} total={data.total_operating} accent={ACCENTS.teal} signed comparative={cmp} />
      <Section title="Investing Activities" rows={data.investing} total={data.total_investing} accent={ACCENTS.slate} signed comparative={cmp} />
      <Section title="Financing Activities" rows={data.financing} total={data.total_financing} accent={ACCENTS.deep} signed comparative={cmp} />
      <div className={`fs-net ${data.net_change >= 0 ? 'pos' : 'neg'}`}>
        <div className="fs-net-label">
          <span className="fs-net-k">Net Change in Cash</span>
          <span className="fs-net-sub">Operating + Investing + Financing</span>
        </div>
        <div className="fs-net-val">
          {data.net_change < 0 ? '(' : ''}<Figure value={Math.abs(data.net_change)} />{data.net_change < 0 ? ')' : ''}
        </div>
      </div>
      <div className="fs-cash-band">
        <div className="fs-cash-cell">
          <span className="fs-cash-k">Opening Cash</span>
          <span className="fs-cash-v"><Figure value={data.opening_cash} /></span>
        </div>
        <div className="fs-cash-arrow">→</div>
        <div className="fs-cash-cell">
          <span className="fs-cash-k">Closing Cash</span>
          <span className="fs-cash-v strong"><Figure value={data.closing_cash} /></span>
        </div>
      </div>
    </div>
  );
}
