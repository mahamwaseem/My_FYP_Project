// src/COA/Accountaccount.jsx  —  PREMIUM TEAL EDITION  · Level 4
import React from 'react';
import useAccountAccount from './Useaccountaccount';
import './Accountaccount.css';

const SaveIcon   = () => (<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>);
const EditIcon   = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>);
const DeleteIcon = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>);
const ClearIcon  = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>);
const BackIcon   = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>);
const LoaderIcon = () => (<svg className="acc-spinner" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>);

const AccountAccount = ({ onBack }) => {
  const {
    accounts, classes, form, editingId, selectedRow,
    loading, saving, error, successMsg, nextId,
    handleChange, handleSave, handleEdit, handleDelete,
    resetForm, handleRowClick,
  } = useAccountAccount();

  return (
    <div className="acc-page">

      {/* ── HEADER ── */}
      <header className="acc-header">
        <div className="acc-header-inner">
          {onBack && (
            <button className="acc-back-btn" onClick={onBack}>
              <BackIcon /> Home
            </button>
          )}
          <div className="acc-header-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
          </div>
          <div className="acc-header-text">
            <h1 className="acc-header-title">Account</h1>
            <p className="acc-header-sub">Chart of Accounts · Ledger Accounts · Level 4</p>
          </div>
          <div className="acc-header-meta">
            <div className="acc-header-stat">
              <div className="acc-header-stat-num">{loading ? '—' : accounts.length}</div>
              <div className="acc-header-stat-label">Total Accounts</div>
            </div>
            <div className="acc-header-stat">
              <div className="acc-header-stat-num">
                {loading ? '—' : accounts.filter(a => a.is_active).length}
              </div>
              <div className="acc-header-stat-label">Active</div>
            </div>
          </div>
        </div>
      </header>

      {/* ── TOASTS ── */}
      {error && (
        <div className="acc-toast acc-toast--error">
          <div className="acc-toast-icon">✕</div>
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="acc-toast acc-toast--success">
          <div className="acc-toast-icon">✓</div>
          <span>{successMsg}</span>
        </div>
      )}

      <div className="acc-content">

        {/* ── FORM PANEL ── */}
        <aside className="acc-panel acc-form-panel">
          <div className="acc-panel-head">
            <div className="acc-panel-eyebrow">
              <span className="acc-panel-badge">
                <span className="acc-panel-badge-dot"></span>
                {editingId ? 'Edit Mode' : 'Add New'}
              </span>
            </div>
            <h2 className="acc-panel-title">Account Details</h2>
          </div>

          <div className="acc-form">

            {/* Account ID — auto */}
            <div className="acc-field">
              <label className="acc-label">Account ID</label>
              <div className="acc-input-wrap">
                <input
                  className="acc-input acc-input--readonly"
                  type="text"
                  value={editingId || nextId}
                  readOnly
                />
                <span className="acc-input-badge">Auto</span>
              </div>
            </div>

            {/* Class dropdown */}
            <div className="acc-field">
              <label className="acc-label">
                Class <span className="acc-required">*</span>
              </label>
              <select
                className="acc-input acc-select"
                name="class_id"
                value={form.class_id}
                onChange={handleChange}
              >
                <option value="">— Select a Class —</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={String(cls.id)}>
                    {cls.name}
                    {cls.category_name ? ` (${cls.category_name})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Account Name */}
            <div className="acc-field">
              <label className="acc-label">
                Account Name <span className="acc-required">*</span>
              </label>
              <input
                className="acc-input"
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Cash in Hand, Bank Account…"
                autoComplete="off"
              />
            </div>

            {/* Active checkbox */}
            <div className="acc-field acc-field--inline">
              <label className="acc-checkbox-label">
                <input
                  type="checkbox"
                  name="is_active"
                  className="acc-checkbox"
                  checked={form.is_active}
                  onChange={handleChange}
                />
                <span className="acc-checkbox-custom"></span>
                Active
              </label>
            </div>

          </div>

          {/* ── Buttons ── */}
          <div className="acc-actions">
            <button className="acc-btn acc-btn--save" onClick={handleSave} disabled={saving}>
              {saving ? <LoaderIcon /> : <SaveIcon />}
              <span>{saving ? 'Saving…' : editingId ? 'Update Account' : 'Save Account'}</span>
            </button>
            <div className="acc-btn-row">
              <button className="acc-btn acc-btn--edit" onClick={handleEdit} disabled={!selectedRow}>
                <EditIcon /><span>Edit</span>
              </button>
              <button className="acc-btn acc-btn--delete" onClick={handleDelete} disabled={!selectedRow}>
                <DeleteIcon /><span>Delete</span>
              </button>
            </div>
            <button className="acc-btn acc-btn--clear" onClick={resetForm}>
              <ClearIcon /><span>Clear Form</span>
            </button>
          </div>
        </aside>

        {/* ── TABLE PANEL ── */}
        <section className="acc-panel acc-table-panel">
          <div className="acc-panel-head acc-panel-head--row">
            <div>
              <div className="acc-panel-eyebrow">
                <span className="acc-panel-badge">
                  <span className="acc-panel-badge-dot"></span>
                  Records
                </span>
              </div>
              <h2 className="acc-panel-title">Accounts List</h2>
            </div>
            <div className="acc-count-pill">
              <span className="acc-count-dot"></span>
              {loading ? '…' : accounts.length}&nbsp;
              {accounts.length === 1 ? 'account' : 'accounts'}
            </div>
          </div>

          <div className="acc-table-wrapper">
            {loading ? (
              <div className="acc-empty">
                <div className="acc-empty-icon"><LoaderIcon /></div>
                <p className="acc-empty-title">Loading records…</p>
              </div>
            ) : accounts.length === 0 ? (
              <div className="acc-empty">
                <div className="acc-empty-icon">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                </div>
                <p className="acc-empty-title">No accounts yet</p>
                <p className="acc-empty-sub">Add your first ledger account using the form on the left.</p>
              </div>
            ) : (
              <table className="acc-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Account ID</th>
                    <th>Account Name</th>
                    <th>Class</th>
                    <th>Category</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((acc, idx) => (
                    <tr
                      key={acc.id}
                      className={`acc-table-row${selectedRow?.id === acc.id ? ' acc-table-row--selected' : ''}`}
                      onClick={() => handleRowClick(acc)}
                    >
                      <td className="acc-td-num">{String(idx + 1).padStart(2, '0')}</td>
                      <td className="acc-td-id">{acc.id}</td>
                      <td className="acc-td-name">{acc.name}</td>
                      <td>
                        <span className="acc-class-chip">
                          <span className="acc-class-chip-dot"></span>
                          {acc.class_name || `#${acc.class_id}`}
                        </span>
                      </td>
                      <td>
                        {acc.category_name && (
                          <span className="acc-cat-chip">
                            <span className="acc-cat-chip-dot"></span>
                            {acc.category_name}
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={`acc-status${acc.is_active ? ' acc-status--active' : ' acc-status--inactive'}`}>
                          <span className="acc-status-dot"></span>
                          {acc.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Selected hint bar */}
          {selectedRow && (
            <div className="acc-selected-bar">
              <span className="acc-selected-bar-dot"></span>
              <span className="acc-selected-bar-text">
                Selected: <strong>{selectedRow.name}</strong>
              </span>
              {selectedRow.class_name && (
                <span className="acc-selected-bar-class">{selectedRow.class_name}</span>
              )}
              {selectedRow.category_name && (
                <span className="acc-selected-bar-cat">{selectedRow.category_name}</span>
              )}
              <span className="acc-selected-bar-id">ID #{selectedRow.id}</span>
            </div>
          )}
        </section>

      </div>
    </div>
  );
};

export default AccountAccount;