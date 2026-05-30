import React, { useState, useEffect, useMemo } from 'react';
import { convertAmount, pairRate, findBaseCurrency, rateOf, formatMoney } from '../../utils/helpers';

/* Currency Converter — automatic conversion using each currency's stored
   exchange_rate (base-units per 1 unit). Pick From/To, type an amount, get the
   converted value live, plus a quick table of the amount in every currency. */
export default function CurrencyConverter({ currencies = [] }) {
  const base = useMemo(() => findBaseCurrency(currencies), [currencies]);
  const [amount, setAmount] = useState('1000');
  const [fromCode, setFromCode] = useState('');
  const [toCode, setToCode] = useState('');

  // sensible defaults once currencies load: From = base, To = first non-base
  useEffect(() => {
    if (!currencies.length) return;
    if (!fromCode) setFromCode((base || currencies[0]).code);
    if (!toCode) {
      const other = currencies.find((c) => c.code !== (base || currencies[0]).code);
      setToCode((other || currencies[0]).code);
    }
  }, [currencies, base, fromCode, toCode]);

  const from = currencies.find((c) => c.code === fromCode) || null;
  const to   = currencies.find((c) => c.code === toCode) || null;

  const converted = convertAmount(amount, from, to);
  const rate = pairRate(from, to);

  const swap = () => { setFromCode(toCode); setToCode(fromCode); };

  if (!currencies.length) return null;

  return (
    <div className="card fx-card" style={{ padding: '20px', marginBottom: '20px' }}>
      <div className="fx-head">
        <div>
          <h3 className="fx-title">Currency Converter</h3>
          <p className="fx-sub">Automatic conversion using your stored exchange rates.</p>
        </div>
        {base && <span className="badge status-posted">Base: {base.code}</span>}
      </div>

      <div className="fx-row">
        {/* amount + from */}
        <div className="fx-field">
          <label className="form-label">Amount</label>
          <div className="fx-amount">
            <input
              type="number" className="form-control text-mono" min="0" step="0.01"
              value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00"
            />
            <select className="form-control fx-select" value={fromCode} onChange={(e) => setFromCode(e.target.value)}>
              {currencies.map((c) => <option key={c.id} value={c.code}>{c.code}</option>)}
            </select>
          </div>
        </div>

        {/* swap */}
        <button className="btn btn-ghost fx-swap" onClick={swap} title="Swap currencies" aria-label="Swap">⇄</button>

        {/* converted + to */}
        <div className="fx-field">
          <label className="form-label">Converted to</label>
          <div className="fx-amount">
            <input className="form-control text-mono fx-result" value={formatMoney(converted)} readOnly tabIndex={-1} />
            <select className="form-control fx-select" value={toCode} onChange={(e) => setToCode(e.target.value)}>
              {currencies.map((c) => <option key={c.id} value={c.code}>{c.code}</option>)}
            </select>
          </div>
        </div>
      </div>

      {from && to && (
        <div className="fx-rateline">
          <span className="text-mono">
            {to.symbol || ''}{formatMoney(converted)} {to.code}
          </span>
          <span className="fx-rate-detail">
            1 {from.code} = <strong className="text-mono">{formatMoney(rate, 6)}</strong> {to.code}
          </span>
        </div>
      )}

      {/* amount in every currency */}
      <div className="fx-grid">
        {currencies.map((c) => {
          const val = convertAmount(amount, from, c);
          const active = c.code === toCode;
          return (
            <button
              key={c.id}
              className={`fx-chip${active ? ' active' : ''}`}
              onClick={() => setToCode(c.code)}
              title={`1 ${c.code} = ${formatMoney(rateOf(c), 6)} ${base ? base.code : 'base'}`}
            >
              <span className="fx-chip-code">{c.symbol ? `${c.symbol} ` : ''}{c.code}</span>
              <span className="fx-chip-val text-mono">{formatMoney(val)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
