import React, { useState, useEffect } from 'react';
import { voucherAPI } from '../../services/api';
import { useCurrencies, useToast } from '../../hooks/useFinTrack';
import { validateVoucherLines, computeTotals, sanitizeObject, toISODate, formatDecimal } from '../../utils/helpers';
import { Modal } from '../shared/UI';
import './VoucherForm.css';

const EMPTY_LINE = { account_id: '', account_name: '', description: '', debit_amount: '', credit_amount: '' };

const defaultHeader = {
  voucher_type: 'JV',
  voucher_date: toISODate(new Date()),
  description: '',
  reference_number: '',
  currency_id: '',
  exchange_rate: '1.000000',
  notes: '',
};

function LineRow({ line, index, onChange, onRemove, canRemove }) {
  const handleChange = (field, value) => onChange(index, field, value);

  const setDebit = (val) => {
    handleChange('debit_amount', val);
    if (val) handleChange('credit_amount', '');
  };
  const setCredit = (val) => {
    handleChange('credit_amount', val);
    if (val) handleChange('debit_amount', '');
  };

  return (
    <tr className="line-row">
      <td className="line-num">{index + 1}</td>
      <td>
        <input
          type="text"
          className="form-control form-control-sm"
          placeholder="Account ID"
          value={line.account_id}
          onChange={(e) => handleChange('account_id', e.target.value)}
        />
      </td>
      <td>
        <input
          type="text"
          className="form-control form-control-sm"
          placeholder="Description (optional)"
          value={line.description}
          onChange={(e) => handleChange('description', e.target.value)}
          maxLength={200}
        />
      </td>
      <td>
        <input
          type="number"
          className="form-control form-control-sm amount-input"
          placeholder="0.00"
          min="0" step="0.01"
          value={line.debit_amount}
          onChange={(e) => setDebit(e.target.value)}
        />
      </td>
      <td>
        <input
          type="number"
          className="form-control form-control-sm amount-input"
          placeholder="0.00"
          min="0" step="0.01"
          value={line.credit_amount}
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
  const [header, setHeader] = useState({ ...defaultHeader });
  const [lines,  setLines]  = useState([{ ...EMPTY_LINE }, { ...EMPTY_LINE }]);
  const [errors, setErrors] = useState([]);
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const { currencies } = useCurrencies();

  // Pre-populate for edit
  useEffect(() => {
    if (voucher) {
      setHeader({
        voucher_type:     voucher.voucher_type || 'JV',
        voucher_date:     toISODate(voucher.voucher_date),
        description:      voucher.description || '',
        reference_number: voucher.reference_number || '',
        currency_id:      voucher.currency_id || '',
        exchange_rate:    voucher.exchange_rate || '1.000000',
        notes:            voucher.notes || '',
      });
      setLines(
        (voucher.lines || []).map((l) => ({
          account_id:    String(l.account_id || ''),
          description:   l.description || '',
          debit_amount:  l.debit_amount  ? String(l.debit_amount)  : '',
          credit_amount: l.credit_amount ? String(l.credit_amount) : '',
        }))
      );
    }
  }, [voucher]);

  const handleHeaderChange = (field, value) => {
    setHeader((prev) => ({ ...prev, [field]: value }));
  };

  const handleLineChange = (index, field, value) => {
    setLines((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addLine = () => setLines((prev) => [...prev, { ...EMPTY_LINE }]);
  const removeLine = (index) => setLines((prev) => prev.filter((_, i) => i !== index));

  const { totalDebit, totalCredit, balanced } = computeTotals(lines);

  const handleSubmit = async () => {
    const lineErrors = validateVoucherLines(lines);
    if (!header.voucher_date) lineErrors.unshift('Voucher date is required.');
    if (!header.description)  lineErrors.unshift('Description is required.');

    if (lineErrors.length) { setErrors(lineErrors); return; }
    setErrors([]);
    setSaving(true);

    const payload = sanitizeObject({
      ...header,
      lines: lines.map((l) => ({
        account_id:    parseInt(l.account_id, 10) || l.account_id,
        description:   l.description,
        debit_amount:  parseFloat(l.debit_amount)  || 0,
        credit_amount: parseFloat(l.credit_amount) || 0,
      })),
    });

    try {
      if (voucher?.id) {
        await voucherAPI.update(voucher.id, payload);
        toast.success('Voucher updated.', 'Saved');
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
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`);
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
      title={isEdit ? `Edit Voucher — ${voucher.voucher_number}` : 'New Voucher'}
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
      {/* Header Fields */}
      <div className="voucher-form-header">
        <div className="form-group">
          <label className="form-label required">Voucher Type</label>
          <select
            className="form-control"
            value={header.voucher_type}
            onChange={(e) => handleHeaderChange('voucher_type', e.target.value)}
          >
            <option value="PV">Payment Voucher (PV)</option>
            <option value="RV">Receipt Voucher (RV)</option>
            <option value="JV">Journal Voucher (JV)</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label required">Voucher Date</label>
          <input
            type="date" className="form-control"
            value={header.voucher_date}
            onChange={(e) => handleHeaderChange('voucher_date', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Reference No.</label>
          <input
            type="text" className="form-control"
            placeholder="PO-1234 / INV-001"
            value={header.reference_number}
            onChange={(e) => handleHeaderChange('reference_number', e.target.value)}
            maxLength={100}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Currency</label>
          <select
            className="form-control"
            value={header.currency_id}
            onChange={(e) => handleHeaderChange('currency_id', e.target.value)}
          >
            <option value="">Default (USD)</option>
            {currencies.map((c) => (
              <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
            ))}
          </select>
        </div>
        <div className="form-group span-2">
          <label className="form-label required">Description</label>
          <input
            type="text" className="form-control"
            placeholder="Brief description of this voucher…"
            value={header.description}
            onChange={(e) => handleHeaderChange('description', e.target.value)}
            maxLength={500}
          />
        </div>
        <div className="form-group span-2">
          <label className="form-label">Notes</label>
          <textarea
            className="form-control"
            rows={2}
            placeholder="Additional notes (optional)…"
            value={header.notes}
            onChange={(e) => handleHeaderChange('notes', e.target.value)}
            maxLength={1000}
          />
        </div>
      </div>

      <div className="divider" />

      {/* Lines Table */}
      <div className="lines-section">
        <div className="lines-header">
          <h4>Voucher Lines</h4>
          <button type="button" className="btn btn-secondary btn-sm" onClick={addLine}>
            + Add Line
          </button>
        </div>

        <div className="lines-table-wrapper">
          <table className="lines-table">
            <thead>
              <tr>
                <th style={{ width: '36px' }}>#</th>
                <th style={{ width: '120px' }}>Account ID</th>
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

        {/* Balance Indicator */}
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

      {/* Validation Errors */}
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
