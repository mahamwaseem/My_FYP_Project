import React, { useState, useEffect } from 'react';
import Icon from './shared/Icon';
import { TYPES } from '../services/mockData';
import {
  fmt, fmtCur, todayISO, validateEntry, debitAccount, creditAccount,
} from '../utils/templateHelpers';
import { useApplyTemplate, useToast } from '../hooks/useTemplates';

export default function ApplyTemplate({ template, onClose, onCreated }) {
  const toast = useToast();
  const { apply, submitting } = useApplyTemplate();

  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayISO());
  const [description, setDescription] = useState('');
  const [recurring, setRecurring] = useState(false);
  const [frequency, setFrequency] = useState('MONTHLY');

  // seed defaults whenever a new template opens
  useEffect(() => {
    if (template) {
      setAmount(String(template.amount ?? ''));
      setDate(todayISO());
      setDescription(template.name || '');
      setRecurring(Boolean(template.recurring));
      setFrequency(template.frequency || 'MONTHLY');
    }
  }, [template]);

  // close on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!template) return null;
  const meta = TYPES[template.type] || { tone: 'teal', label: template.type || 'Voucher', long: 'Voucher' };
  const v = validateEntry(template, { amount, date });

  const submit = async () => {
    if (!v.valid) { toast.warning(v.errors[0]); return; }
    const res = await apply(template, { amount, date, description, recurring, frequency });
    if (res.ok) {
      toast.success(
        `${res.data.voucher_no} created${recurring ? ' · recurring ' + frequency.toLowerCase() : ''}.`,
        'Voucher created'
      );
      onCreated && onCreated(res);
      onClose();
    } else {
      // Real failure (e.g. 403 = viewer has no permission). Show an honest
      // error and keep the drawer open; nothing was created.
      toast.error(
        res.error || 'The voucher could not be created.',
        res.status === 403 ? 'Access denied' : 'Could not create voucher'
      );
    }
  };

  return (
    <div className="vt-drawer-scrim" onMouseDown={onClose}>
      <aside className={`vt-drawer tone-${meta.tone}`} onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <header className="vt-drawer-head">
          <span className="vt-orb vt-orb1" />
          <div className="vt-dh-row">
            <div>
              <span className="vt-drawer-type">{meta.long}</span>
              <h2 className="vt-drawer-title">{template.name}</h2>
            </div>
            <button className="vt-drawer-x" onClick={onClose} aria-label="Close"><Icon name="close" size={18} /></button>
          </div>
        </header>

        <div className="vt-drawer-body">
          {/* locked accounts (pre-filled by the template) */}
          <div className="vt-field-label"><Icon name="scale" size={13} /> Double-entry (accounts locked)</div>
          <div className="vt-locked">
            <div className="vt-locked-row">
              <span className="vt-locked-tag dr">Dr</span>
              <span className="vt-locked-acct">{debitAccount(template)}</span>
              <span className="vt-locked-amt">{amount ? fmt(amount) : '—'}</span>
            </div>
            <div className="vt-locked-row">
              <span className="vt-locked-tag cr">Cr</span>
              <span className="vt-locked-acct">{creditAccount(template)}</span>
              <span className="vt-locked-amt">{amount ? fmt(amount) : '—'}</span>
            </div>
          </div>

          {/* editable fields */}
          <div className="vt-field">
            <label htmlFor="vt-amount"><Icon name="edit" size={13} /> Amount ({fmtCur(0).split(' ')[0]})</label>
            <input id="vt-amount" type="number" min="0" step="1" value={amount} placeholder="0"
                   onChange={(e) => setAmount(e.target.value)} autoFocus />
          </div>

          <div className="vt-field">
            <label htmlFor="vt-date"><Icon name="calendar" size={13} /> Date</label>
            <input id="vt-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <div className="vt-field">
            <label htmlFor="vt-desc"><Icon name="edit" size={13} /> Description / narration</label>
            <textarea id="vt-desc" rows={2} value={description}
                      placeholder="What is this voucher for?"
                      onChange={(e) => setDescription(e.target.value)} />
          </div>

          {/* recurring */}
          <button className={`vt-toggle${recurring ? ' on' : ''}`} onClick={() => setRecurring((r) => !r)} type="button">
            <span className="vt-toggle-track"><span className="vt-toggle-knob" /></span>
            <span className="vt-toggle-text">
              Set up as recurring
              <span className="vt-toggle-sub">Auto-generate on a schedule</span>
            </span>
          </button>
          {recurring && (
            <div className="vt-freq">
              {['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'].map((f) => (
                <button key={f} type="button" className={frequency === f ? 'on' : ''} onClick={() => setFrequency(f)}>
                  {f[0] + f.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          )}

          {/* live balance check */}
          <div className={`vt-balance ${v.balanced && Number(amount) > 0 ? 'ok' : 'idle'}`}>
            <div className="vt-balance-side"><span>Total Debit</span><b>{fmt(v.totalDebit)}</b></div>
            <div className="vt-balance-eq">{v.balanced && Number(amount) > 0 ? '=' : '⇄'}</div>
            <div className="vt-balance-side"><span>Total Credit</span><b>{fmt(v.totalCredit)}</b></div>
          </div>
          <div className="vt-balance-note">
            {Number(amount) > 0
              ? (v.balanced ? 'Balanced — Debit equals Credit ✓' : 'Not balanced yet')
              : 'Enter an amount to balance the entry'}
          </div>
        </div>

        <footer className="vt-drawer-foot">
          <button className="vt-btn-ghost" onClick={onClose}>Cancel</button>
          <button className="vt-btn-primary" onClick={submit} disabled={!v.valid || submitting}>
            <Icon name="bolt" size={16} /> {submitting ? 'Creating…' : 'Create Voucher'}
          </button>
        </footer>
      </aside>
    </div>
  );
}