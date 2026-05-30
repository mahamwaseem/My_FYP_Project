import React, { useState, useEffect, useCallback } from 'react';
import { voucherAPI, coaAPI, recurringAPI } from '../../services/api';
import { useCurrencies, useToast } from '../../hooks/useFinTrack';
import { toISODate, formatDecimal } from '../../utils/helpers';
import { Modal } from '../shared/UI';
import './VoucherForm.css';

const EMPTY_LINE = { account: '', description: '', debit: '', credit: '', last_touched: '' };

const defaultHeader = {
  v_type:        'JV',
  date:          toISODate(new Date()),
  narration:     '',
  reference:     '',
  currency:      '',
  exchange_rate: '1.000000',
};

function backendToForm(voucher) {
  return {
    header: {
      v_type:        voucher.v_type        || 'JV',
      date:          toISODate(voucher.date),
      narration:     voucher.narration     || '',
      reference:     voucher.reference     || '',
      currency:      voucher.currency      || '',
      exchange_rate: voucher.exchange_rate || '1.000000',
    },
    lines: (voucher.lines || []).map((l) => ({
      account:      String(l.account || ''),
      description:  l.description    || '',
      debit:        parseFloat(l.debit)  > 0 ? String(l.debit)  : '',
      credit:       parseFloat(l.credit) > 0 ? String(l.credit) : '',
      last_touched: '',
    })),
  };
}

function toNum(val) {
  const n = parseFloat(String(val ?? '').trim());
  return isNaN(n) ? 0 : n;
}

function formToBackend(header, lines) {
  return {
    v_type:        header.v_type,
    date:          header.date,
    narration:     header.narration  || '',
    reference:     header.reference  || '',
    currency:      header.currency   || null,
    exchange_rate: header.exchange_rate || '1.000000',
    lines: lines.map((l) => {
      const d = toNum(l.debit);
      const c = toNum(l.credit);
      return {
        account:     parseInt(l.account, 10),
        description: l.description || '',
        debit:       d,
        credit:      c,
      };
    }),
  };
}

function LineRow({ line, index, onChange, onRemove, canRemove, accounts }) {
  const set = (field, val) => onChange(index, field, val);
  const setDebit = (val) => {
    const next = String(val ?? '');
    const debitValue = toNum(next);
    const creditValue = toNum(line.credit);
    set('debit', next);
    set('last_touched', 'debit');
    if (debitValue > 0 && creditValue > 0) {
      set('credit', '');
    }
  };
  const setCredit = (val) => {
    const next = String(val ?? '');
    const creditValue = toNum(next);
    const debitValue = toNum(line.debit);
    set('credit', next);
    set('last_touched', 'credit');
    if (creditValue > 0 && debitValue > 0) {
      set('debit', '');
    }
  };

  return (
    <tr className="line-row">
      <td className="line-num">{index + 1}</td>

      <td>
        <select
          className="form-control form-control-sm"
          value={line.account}
          onChange={(e) => set('account', e.target.value)}
        >
          <option value="">— Select Account —</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              [{a.id}] {a.name} — {a.group_name}
            </option>
          ))}
        </select>
      </td>

      <td>
        <input
          type="text"
          className="form-control form-control-sm"
          placeholder="Description (optional)"
          value={line.description}
          onChange={(e) => set('description', e.target.value)}
          maxLength={200}
        />
      </td>

      <td>
        <input
          type="number"
          min="0"
          step="0.01"
          className="form-control form-control-sm amount-input"
          placeholder="0.00"
          value={line.debit}
          onChange={(e) => setDebit(e.target.value)}
        />
      </td>

      <td>
        <input
          type="number"
          min="0"
          step="0.01"
          className="form-control form-control-sm amount-input"
          placeholder="0.00"
          value={line.credit}
          onChange={(e) => setCredit(e.target.value)}
        />
      </td>

      <td>
        {canRemove && (
          <button
            type="button"
            className="btn btn-ghost btn-icon btn-sm remove-line-btn"
            onClick={() => onRemove(index)}
            title="Remove line"
          >✕</button>
        )}
      </td>
    </tr>
  );
}

export default function VoucherForm({ voucher, onClose, onSaved }) {
  const [header,   setHeader]   = useState({ ...defaultHeader });
  const [lines,    setLines]    = useState([{ ...EMPTY_LINE }, { ...EMPTY_LINE }]);
  const [errors,   setErrors]   = useState([]);
  const [saving,   setSaving]   = useState(false);
  const [accounts, setAccounts] = useState([]);
  // recurring schedule (optional) — only used when creating a new voucher
  const [recurring, setRecurring] = useState({
    enabled:    false,
    frequency:  'MONTHLY',
    start_date: toISODate(new Date()),
    end_date:   '',
  });
  const toast = useToast();
  const { currencies } = useCurrencies();

  useEffect(() => {
    coaAPI.accounts()
      .then((res) => setAccounts(Array.isArray(res) ? res : (res.data || [])))
      .catch(() => setAccounts([]));
  }, []);

  useEffect(() => {
    if (voucher) {
      const { header: h, lines: l } = backendToForm(voucher);
      setHeader(h);
      setLines(l);
    }
  }, [voucher]);

  const handleHeaderChange = useCallback((field, value) =>
    setHeader((prev) => ({ ...prev, [field]: value })), []);

  const handleLineChange = useCallback((index, field, value) =>
    setLines((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    }), []);

  const addLine    = () => setLines((prev) => [...prev, { ...EMPTY_LINE }]);
  const removeLine = (i) => setLines((prev) => prev.filter((_, idx) => idx !== i));

  // Live totals shown in the balance indicator
  const totalDebit  = lines.reduce((s, l) => s + toNum(l.debit),  0);
  const totalCredit = lines.reduce((s, l) => s + toNum(l.credit), 0);
  const balanced    = Math.abs(totalDebit - totalCredit) < 0.001 && totalDebit > 0;

  const handleSubmit = async () => {
    // ── Frontend validation: only check things the user must fix before sending ──
    // Balance is NOT checked here — the backend validates it and returns a clear
    // error if unbalanced. This avoids false positives from debit-wins logic.
    const errs = [];

    if (!header.date)      errs.push('Voucher date is required.');
    if (!header.narration) errs.push('Description is required.');
    if (lines.length < 2)  errs.push('A voucher needs at least 2 lines.');

    lines.forEach((l, i) => {
      const debit = toNum(l.debit);
      const credit = toNum(l.credit);
      if (!l.account)                          errs.push(`Line ${i + 1}: Select an account.`);
      if (debit === 0 && credit === 0)
        errs.push(`Line ${i + 1}: Enter a Debit or Credit amount.`);
      if (debit > 0 && credit > 0)
        errs.push(`Line ${i + 1}: A line cannot have both Debit and Credit amounts.`);
    });

    if (errs.length) { setErrors(errs); return; }
    setErrors([]);
    setSaving(true);

    try {
      const payload = formToBackend(header, lines);
      if (voucher?.id) {
        await voucherAPI.update(voucher.id, payload);
        toast.success('Voucher updated.', 'Saved');
      } else if (recurring.enabled) {
        // Recurring: create the voucher as a DRAFT (you can still edit/delete it),
        // flag it as recurring, and create the schedule that tracks future runs.
        const recurringPayload = {
          ...payload,
          is_recurring: true,
          recurring_frequency: recurring.frequency,
          recurring_end_date: recurring.end_date || null,
        };
        const created = await voucherAPI.create(recurringPayload);
        const newId = (created && (created.data?.id ?? created.id));
        try {
          await recurringAPI.create({
            template_voucher: newId,
            frequency:        recurring.frequency,
            start_date:       recurring.start_date,
            next_due_date:    recurring.start_date,
            end_date:         recurring.end_date || null,
          });
          toast.success('Recurring voucher created (kept as Draft — post it when ready).', 'Recurring Created');
        } catch (schedErr) {
          const m = schedErr.data?.detail || schedErr.message;
          toast.warning(`Voucher created, but the schedule failed: ${m}`, 'Partial');
        }
      } else {
        await voucherAPI.create(payload);
        toast.success('Voucher created.', 'Created');
      }
      onSaved();
    } catch (err) {
      const msg = err.data?.detail || err.data?.non_field_errors?.[0] || err.message;
      toast.error(msg, 'Save Failed');
      if (err.data && typeof err.data === 'object') {
        const fieldErrors = Object.entries(err.data)
          .filter(([k]) => k !== 'success')
          .flatMap(([k, v]) => {
            if (k === 'lines') {
              if (typeof v === 'string') {
                return [v];
              }
              if (Array.isArray(v)) {
                return v.flatMap((lineErr, i) =>
                  typeof lineErr === 'object'
                    ? Object.entries(lineErr).map(([f, m]) => `Line ${i + 1} — ${f}: ${m}`)
                    : [`Line ${i + 1}: ${lineErr}`]
                );
              }
            }
            return [`${k}: ${Array.isArray(v) ? v.join(', ') : v}`];
          });
        if (fieldErrors.length) setErrors(fieldErrors);
      }
    } finally {
      setSaving(false);
    }
  };

  const isEdit = !!voucher?.id;

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? `Edit Voucher — ${voucher.voucher_no}` : 'New Voucher'}
      size="xl"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Voucher'}
          </button>
        </>
      }
    >
      <div className="voucher-form-header">
        <div className="form-group">
          <label className="form-label required">Voucher Type</label>
          <select
            className="form-control"
            value={header.v_type}
            onChange={(e) => handleHeaderChange('v_type', e.target.value)}
          >
            <option value="PV">Payment Voucher (PV)</option>
            <option value="RV">Receipt Voucher (RV)</option>
            <option value="JV">Journal Voucher (JV)</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label required">Voucher Date</label>
          <input
            type="date"
            className="form-control"
            value={header.date}
            onChange={(e) => handleHeaderChange('date', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Reference No.</label>
          <input
            type="text"
            className="form-control"
            placeholder="PO-1234 / INV-001"
            value={header.reference}
            onChange={(e) => handleHeaderChange('reference', e.target.value)}
            maxLength={100}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Currency</label>
          <select
            className="form-control"
            value={header.currency}
            onChange={(e) => handleHeaderChange('currency', e.target.value)}
          >
            <option value="">Default (Base Currency)</option>
            {currencies.map((c) => (
              <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
            ))}
          </select>
        </div>

        <div className="form-group span-2">
          <label className="form-label required">Description</label>
          <input
            type="text"
            className="form-control"
            placeholder="Brief description of this voucher…"
            value={header.narration}
            onChange={(e) => handleHeaderChange('narration', e.target.value)}
            maxLength={500}
          />
        </div>
      </div>

      <div className="divider" />

      <div className="lines-section">
        <div className="lines-header">
          <h4>Voucher Lines</h4>
          <button type="button" className="btn btn-secondary btn-sm" onClick={addLine}>
            + Add Line
          </button>
        </div>
        <div className="lines-note" style={{ marginBottom: '10px', color: 'var(--text-secondary)' }}>
          Enter an amount in either Debit or Credit for each line; do not use both on the same line.
        </div>

        <div className="lines-table-wrapper">
          <table className="lines-table">
            <thead>
              <tr>
                <th style={{ width: '36px' }}>#</th>
                <th style={{ width: '260px' }}>Account</th>
                <th>Description</th>
                <th style={{ width: '130px' }}>Debit (Dr)</th>
                <th style={{ width: '130px' }}>Credit (Cr)</th>
                <th style={{ width: '36px' }}></th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, i) => (
                <LineRow
                  key={i}
                  line={line}
                  index={i}
                  onChange={handleLineChange}
                  onRemove={removeLine}
                  canRemove={lines.length > 2}
                  accounts={accounts}
                />
              ))}
            </tbody>
            <tfoot>
              <tr className="totals-row">
                <td colSpan={3} style={{ textAlign: 'right', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                  Totals
                </td>
                <td className="total-cell debit-total">{formatDecimal(totalDebit)}</td>
                <td className="total-cell credit-total">{formatDecimal(totalCredit)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className={`balance-indicator ${balanced ? 'balanced' : 'unbalanced'}`}>
          {balanced ? (
            <span>✓ Balanced — Debit = Credit = {formatDecimal(totalDebit)}</span>
          ) : (
            <span>
              ⚠ Unbalanced — Debit: {formatDecimal(totalDebit)} | Credit: {formatDecimal(totalCredit)} |
              Difference: {formatDecimal(Math.abs(totalDebit - totalCredit))}
            </span>
          )}
        </div>
      </div>

      {/* ── Recurring schedule (new vouchers only) ── */}
      {!isEdit && (
        <div className="recurring-section" style={{ marginTop: '18px', padding: '16px', border: '1px solid var(--border, #e2e8f0)', borderRadius: '12px', background: 'var(--bg-subtle, #f8fafc)' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={recurring.enabled}
              onChange={(e) => setRecurring((r) => ({ ...r, enabled: e.target.checked }))}
            />
            <span style={{ fontWeight: 700 }}>Make this a recurring voucher</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #64748b)' }}>
              — auto-generates on a schedule (rent, salaries, utilities)
            </span>
          </label>

          {recurring.enabled && (
            <>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #64748b)', margin: '10px 0 12px' }}>
                On save, this voucher is created as a <strong>Draft</strong> (you can still edit or delete it) and
                registered as a recurring template. It will appear in the <em>Recurring</em> section, where you can
                generate future vouchers on each due date.
              </div>
              <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                <div className="form-group" style={{ flex: '1 1 160px' }}>
                  <label className="form-label required">Frequency</label>
                  <select
                    className="form-control"
                    value={recurring.frequency}
                    onChange={(e) => setRecurring((r) => ({ ...r, frequency: e.target.value }))}
                  >
                    <option value="DAILY">Daily</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="MONTHLY">Monthly</option>
                    <option value="QUARTERLY">Quarterly</option>
                    <option value="YEARLY">Yearly</option>
                  </select>
                </div>
                <div className="form-group" style={{ flex: '1 1 160px' }}>
                  <label className="form-label required">First due date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={recurring.start_date}
                    onChange={(e) => setRecurring((r) => ({ ...r, start_date: e.target.value }))}
                  />
                </div>
                <div className="form-group" style={{ flex: '1 1 160px' }}>
                  <label className="form-label">End date (optional)</label>
                  <input
                    type="date"
                    className="form-control"
                    value={recurring.end_date}
                    onChange={(e) => setRecurring((r) => ({ ...r, end_date: e.target.value }))}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {errors.length > 0 && (
        <div className="error-alert" style={{ marginTop: '16px', flexDirection: 'column', gap: '4px' }}>
          <strong>Please fix the following:</strong>
          <ul style={{ paddingLeft: '16px', marginTop: '4px' }}>
            {errors.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}
    </Modal>
  );
}