import React, { useState } from 'react';
import { useCurrencies, useToast } from '../../hooks/useFinTrack';
import { currencyAPI } from '../../services/api';
import { Modal, ConfirmDialog, ErrorBoundary } from '../shared/UI';

const EMPTY_FORM = { code: '', name: '', symbol: '', exchange_rate: '1.000000', is_base: false };

export default function Currencies() {
  const { currencies, loading } = useCurrencies();
  const [localList, setLocalList] = useState(null); // override after mutations
  const [showForm, setShowForm]   = useState(false);
  const [editCurr, setEditCurr]   = useState(null);
  const [form, setForm]           = useState({ ...EMPTY_FORM });
  const [saving, setSaving]       = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]   = useState(false);
  const toast = useToast();

  const list = localList ?? currencies;

  const openNew  = () => { setForm({ ...EMPTY_FORM }); setEditCurr(null); setShowForm(true); };
  const openEdit = (c) => { setForm({ code: c.code, name: c.name, symbol: c.symbol || '', exchange_rate: c.exchange_rate || '1.000000', is_base: c.is_base || false }); setEditCurr(c); setShowForm(true); };

  const handleSave = async () => {
    if (!form.code || !form.name) { toast.error('Code and Name are required.'); return; }
    setSaving(true);
    try {
      if (editCurr) {
        const res = await currencyAPI.update(editCurr.id, form);
        setLocalList((list || []).map((c) => c.id === editCurr.id ? (res.data || res) : c));
        toast.success('Currency updated.');
      } else {
        const res = await currencyAPI.create(form);
        setLocalList([...(list || []), res.data || res]);
        toast.success('Currency added.');
      }
      setShowForm(false);
    } catch (err) {
      toast.error(err.message, 'Save Failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await currencyAPI.delete(deleteTarget.id);
      setLocalList((list || []).filter((c) => c.id !== deleteTarget.id));
      toast.success('Currency removed.');
    } catch (err) {
      toast.error(err.message, 'Delete Failed');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <ErrorBoundary>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <button className="btn btn-primary" onClick={openNew}>+ Add Currency</button>
      </div>

      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>Symbol</th>
              <th className="amount-cell">Exchange Rate</th>
              <th>Base?</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>Loading…</td></tr>
            )}
            {!loading && list.length === 0 && (
              <tr><td colSpan={6}>
                <div className="empty-state" style={{ padding: '30px' }}>
                  <div className="empty-state-icon">💱</div>
                  <h3>No currencies</h3>
                  <p>Add a currency to enable multi-currency vouchers.</p>
                </div>
              </td></tr>
            )}
            {list.map((c) => (
              <tr key={c.id}>
                <td className="text-mono" style={{ fontWeight: 600 }}>{c.code}</td>
                <td>{c.name}</td>
                <td>{c.symbol || '—'}</td>
                <td className="amount-cell text-mono">{parseFloat(c.exchange_rate || 1).toFixed(6)}</td>
                <td>{c.is_base ? <span className="badge status-posted">Base</span> : '—'}</td>
                <td>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEdit(c)} title="Edit">✏</button>
                    {!c.is_base && (
                      <button className="btn btn-ghost btn-sm btn-icon" style={{ color: 'var(--color-error)' }} onClick={() => setDeleteTarget(c)} title="Delete">🗑</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Form Modal */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editCurr ? 'Edit Currency' : 'Add Currency'}
        size="sm"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowForm(false)} disabled={saving}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="form-group">
            <label className="form-label required">Currency Code</label>
            <input type="text" className="form-control" placeholder="USD, PKR, EUR…" maxLength={10}
              value={form.code} onChange={(e) => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} />
          </div>
          <div className="form-group">
            <label className="form-label required">Name</label>
            <input type="text" className="form-control" placeholder="US Dollar"
              value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Symbol</label>
            <input type="text" className="form-control" placeholder="$ ₨ €"
              value={form.symbol} onChange={(e) => setForm(f => ({ ...f, symbol: e.target.value }))} maxLength={5} />
          </div>
          <div className="form-group">
            <label className="form-label required">Exchange Rate</label>
            <input type="number" className="form-control" step="0.000001" min="0.000001"
              value={form.exchange_rate} onChange={(e) => setForm(f => ({ ...f, exchange_rate: e.target.value }))} />
            <span className="form-hint">Rate relative to your base currency.</span>
          </div>
          <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
            <input type="checkbox" id="is_base" checked={form.is_base}
              onChange={(e) => setForm(f => ({ ...f, is_base: e.target.checked }))} />
            <label htmlFor="is_base" className="form-label" style={{ margin: 0 }}>Set as base currency</label>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Remove Currency"
        message={`Remove ${deleteTarget?.code} (${deleteTarget?.name})? This cannot be undone if used in vouchers.`}
        confirmLabel="Remove"
        danger loading={deleting}
      />
    </ErrorBoundary>
  );
}
