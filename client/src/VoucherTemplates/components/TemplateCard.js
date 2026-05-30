import React from 'react';
import Icon from './shared/Icon';
import { TYPES } from '../services/mockData';
import { fmt, debitAccount, creditAccount } from '../utils/templateHelpers';

const TYPE_ICON = { RV: 'receipt', PV: 'payment', JV: 'journal' };

export default function TemplateCard({ template, index = 0, onUse }) {
  const meta = TYPES[template.type] || { tone: 'teal', label: template.type || 'Voucher' };
  const dr = debitAccount(template);
  const cr = creditAccount(template);

  return (
    <article className={`vt-card tone-${meta.tone}`} style={{ animationDelay: `${index * 80}ms` }}>
      <span className="vt-shine" />
      <span className="vt-orb vt-orb1" />
      <span className="vt-orb vt-orb2" />
      <div className="vt-watermark"><Icon name={TYPE_ICON[template.type]} size={150} stroke={0.8} /></div>

      <div className="vt-card-top">
        <span className="vt-chip"><Icon name={TYPE_ICON[template.type]} size={14} /> {meta.label}</span>
        {template.recurring
          ? <span className="vt-recur"><Icon name="repeat" size={11} /> Recurring</span>
          : <span className="vt-recur ghost"><Icon name="spark" size={11} /> One-off</span>}
      </div>

      <div className="vt-amount">
        <span className="vt-amount-cur">PKR</span>
        <span className="vt-amount-n">{fmt(template.amount)}</span>
      </div>
      <span className="vt-amount-hint">editable default amount</span>

      <h3 className="vt-card-name">{template.name}</h3>
      <p className="vt-card-desc">{template.description}</p>

      <div className="vt-flow">
        <div className="vt-leg">
          <span className="vt-leg-k">Debit</span>
          <span className="vt-leg-acct">{dr}</span>
        </div>
        <span className="vt-flow-arrow"><Icon name="arrow" size={14} /></span>
        <div className="vt-leg">
          <span className="vt-leg-k">Credit</span>
          <span className="vt-leg-acct">{cr}</span>
        </div>
      </div>

      <div className="vt-card-foot">
        <span className="vt-card-tag">{template.tag}</span>
        <button className="vt-use" onClick={() => onUse(template)}>
          Use template <Icon name="arrow" size={15} />
        </button>
      </div>
    </article>
  );
}