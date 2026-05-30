import React from 'react';
import { Section, Figure, ACCENTS } from './Parts';

function Donut({ income, expense }) {
  const profit = Math.max(income - expense, 0);
  const total = income || 1;
  const expPct = (expense / total) * 100;
  const proPct = (profit / total) * 100;
  return (
    <div className="fs-donut-wrap">
      <div className="fs-donut" style={{ background: `conic-gradient(#94a3b8 0 ${expPct}%, #0f766e ${expPct}% ${expPct + proPct}%, #e2e8f0 ${expPct + proPct}% 100%)` }}>
        <div className="fs-donut-hole">
          <span className="fs-donut-k">Margin</span>
          <span className="fs-donut-v">{Math.round(proPct)}%</span>
        </div>
      </div>
      <div className="fs-legend">
        <span><i style={{ background: '#0f766e' }} /> Net Profit</span>
        <span><i style={{ background: '#94a3b8' }} /> Expenses</span>
      </div>
    </div>
  );
}

export default function IncomeStatement({ data, comparative }) {
  if (!data) return null;
  const isProfit = data.is_profit ?? (data.net_profit >= 0);
  const cmp = comparative && data.comparative;
  return (
    <div className="fs-statement">
      <Section title="Income" rows={data.income} total={data.total_income} accent={ACCENTS.teal} comparative={cmp} />
      <Section title="Expenses" rows={data.expenses} total={data.total_expenses} accent={ACCENTS.slate} comparative={cmp} />
      <div className={`fs-net ${isProfit ? 'pos' : 'neg'}`}>
        <div className="fs-net-label">
          <span className="fs-net-k">Net {isProfit ? 'Profit' : 'Loss'}</span>
          <span className="fs-net-sub">Income − Expenses</span>
        </div>
        <div className="fs-net-val"><Figure value={Math.abs(data.net_profit)} /></div>
      </div>
      <Donut income={data.total_income} expense={data.total_expenses} />
    </div>
  );
}
