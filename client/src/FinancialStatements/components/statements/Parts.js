import React, { useState, useEffect, useRef } from 'react';
import { fmt } from '../../utils/statementHelpers';

export function Figure({ value, prefix = '' }) {
  const [shown, setShown] = useState(0);
  const raf = useRef();
  useEffect(() => {
    const start = performance.now(), to = Number(value) || 0, dur = 650;
    const tick = (t) => {
      const p = Math.min(1, (t - start) / dur);
      setShown(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [value]);
  return <span>{prefix}{fmt(shown)}</span>;
}

const paren = (v) => (v < 0 ? `(${fmt(Math.abs(v))})` : fmt(Math.abs(v)));

// `signed` → parentheses for negatives. `comparative` → show prior column.
export function Section({ title, rows, total, totalPrior, accent, signed, comparative }) {
  const safeRows = Array.isArray(rows) ? rows : [];
  const max = Math.max(...safeRows.map((r) => Math.abs(r.amount)), 1);
  return (
    <section className="fs-sec" style={{ '--accent': accent }}>
      <div className={`fs-sec-head${comparative ? ' cmp' : ''}`}>
        <span className="fs-sec-title">{title}</span>
        {comparative && <span className="fs-sec-prior-h">Prior</span>}
        <span className="fs-sec-total">{signed ? paren(total) : fmt(Math.abs(total))}</span>
      </div>
      <div className="fs-rows">
        {safeRows.length ? safeRows.map((r, i) => (
          <div className={`fs-row${comparative ? ' cmp' : ''}`} key={r.name + i} style={{ animationDelay: `${i * 50}ms` }}>
            <span className="fs-row-name">
              {r.code && <span className="fs-row-code">{r.code}</span>}
              {r.name}
            </span>
            {!comparative && (
              <span className="fs-row-bar"><span className="fs-row-fill" style={{ width: `${(Math.abs(r.amount) / max) * 100}%` }} /></span>
            )}
            {comparative && <span className="fs-row-prior">{r.prior != null ? paren(r.prior) : '—'}</span>}
            <span className="fs-row-val">{paren(r.amount)}</span>
          </div>
        )) : (
          <div className="fs-row-empty">No rows available.</div>
        )}
      </div>
    </section>
  );
}

export const ACCENTS = { teal: '#0f766e', deep: '#134e4a', slate: '#475569' };
