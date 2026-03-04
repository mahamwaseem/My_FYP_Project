// src/COA/Accountclass.jsx  —  PREMIUM TEAL EDITION
import React from 'react';
import useAccountClass from './Useaccountclass';
import './Accountclass.css';

const SaveIcon   = () => (<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>);
const EditIcon   = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>);
const DeleteIcon = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>);
const ClearIcon  = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>);
const BackIcon   = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>);
const LoaderIcon = () => (<svg className="acl-spinner" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>);

const AccountClass = ({ onBack }) => {
  const {
    classes, categories, form, editingId, selectedRow,
    loading, saving, error, successMsg, nextId,
    handleChange, handleSave, handleEdit, handleDelete,
    resetForm, handleRowClick,
  } = useAccountClass();

  return (
    <div className="acl-page">

      {/* ── HEADER ── */}
      <header className="acl-header">
        <div className="acl-header-inner">
          {onBack && (
            <button className="acl-back-btn" onClick={onBack}>
              <BackIcon /> Home
            </button>
          )}
          <div className="acl-header-icon">
            {/* Layers icon — represents hierarchy level 3 */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 2 7 12 12 22 7 12 2"/>
              <polyline points="2 17 12 22 22 17"/>
              <polyline points="2 12 12 17 22 12"/>
            </svg>
          </div>
          <div className="acl-header-text">
            <h1 className="acl-header-title">Account Class</h1>
            <p className="acl-header-sub">Chart of Accounts · Class Management · Level 3</p>
          </div>
          <div className="acl-header-meta">
            <div className="acl-header-stat">
              <div className="acl-header-stat-num">{loading ? '—' : classes.length}</div>
              <div className="acl-header-stat-label">Total Classes</div>
            </div>
          </div>
        </div>
      </header>

      {/* ── TOASTS ── */}
      {error && (
        <div className="acl-toast acl-toast--error">
          <div className="acl-toast-icon">✕</div>
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="acl-toast acl-toast--success">
          <div className="acl-toast-icon">✓</div>
          <span>{successMsg}</span>
        </div>
      )}

      <div className="acl-content">

        {/* ── FORM PANEL ── */}
        <aside className="acl-panel acl-form-panel">
          <div className="acl-panel-head">
            <div className="acl-panel-eyebrow">
              <span className="acl-panel-badge">
                <span className="acl-panel-badge-dot"></span>
                {editingId ? 'Edit Mode' : 'Add New'}
              </span>
            </div>
            <h2 className="acl-panel-title">Class Details</h2>
          </div>

          <div className="acl-form">
            {/* Class ID — auto */}
            <div className="acl-field">
              <label className="acl-label">Class ID</label>
              <div className="acl-input-wrap">
                <input
                  className="acl-input acl-input--readonly"
                  type="text"
                  value={editingId || nextId}
                  readOnly
                />
                <span className="acl-input-badge">Auto</span>
              </div>
            </div>

            {/* Category dropdown */}
            <div className="acl-field">
              <label className="acl-label">
                Category <span className="acl-required">*</span>
              </label>
              <select
                className="acl-input acl-select"
                name="category_id"
                value={form.category_id}
                onChange={handleChange}
              >
                <option value="">— Select a Category —</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={String(cat.id)}>
                    {cat.name}
                    {cat.group_name ? ` (${cat.group_name})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Class name */}
            <div className="acl-field">
              <label className="acl-label">
                Class Name <span className="acl-required">*</span>
              </label>
              <input
                className="acl-input"
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Customer, Bank, Cash…"
                autoComplete="off"
              />
            </div>

            {/* Active checkbox */}
            <div className="acl-field acl-field--inline">
              <label className="acl-checkbox-label">
                <input
                  type="checkbox"
                  name="is_active"
                  className="acl-checkbox"
                  checked={form.is_active}
                  onChange={handleChange}
                />
                <span className="acl-checkbox-custom"></span>
                Active
              </label>
            </div>
          </div>

          {/* Buttons */}
          <div className="acl-actions">
            <button className="acl-btn acl-btn--save" onClick={handleSave} disabled={saving}>
              {saving ? <LoaderIcon /> : <SaveIcon />}
              <span>{saving ? 'Saving…' : editingId ? 'Update Class' : 'Save Class'}</span>
            </button>
            <div className="acl-btn-row">
              <button className="acl-btn acl-btn--edit" onClick={handleEdit} disabled={!selectedRow}>
                <EditIcon /><span>Edit</span>
              </button>
              <button className="acl-btn acl-btn--delete" onClick={handleDelete} disabled={!selectedRow}>
                <DeleteIcon /><span>Delete</span>
              </button>
            </div>
            <button className="acl-btn acl-btn--clear" onClick={resetForm}>
              <ClearIcon /><span>Clear Form</span>
            </button>
          </div>
        </aside>

        {/* ── TABLE PANEL ── */}
        <section className="acl-panel acl-table-panel">
          <div className="acl-panel-head acl-panel-head--row">
            <div>
              <div className="acl-panel-eyebrow">
                <span className="acl-panel-badge">
                  <span className="acl-panel-badge-dot"></span>
                  Records
                </span>
              </div>
              <h2 className="acl-panel-title">Classes List</h2>
            </div>
            <div className="acl-count-pill">
              <span className="acl-count-dot"></span>
              {loading ? '…' : classes.length}&nbsp;
              {classes.length === 1 ? 'class' : 'classes'}
            </div>
          </div>

          <div className="acl-table-wrapper">
            {loading ? (
              <div className="acl-empty">
                <div className="acl-empty-icon"><LoaderIcon /></div>
                <p className="acl-empty-title">Loading records…</p>
              </div>
            ) : classes.length === 0 ? (
              <div className="acl-empty">
                <div className="acl-empty-icon">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <polygon points="12 2 2 7 12 12 22 7 12 2"/>
                    <polyline points="2 17 12 22 22 17"/>
                    <polyline points="2 12 12 17 22 12"/>
                  </svg>
                </div>
                <p className="acl-empty-title">No classes yet</p>
                <p className="acl-empty-sub">Add your first account class using the form on the left.</p>
              </div>
            ) : (
              <table className="acl-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Class ID</th>
                    <th>Class Name</th>
                    <th>Category</th>
                    <th>Group</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {classes.map((cls, idx) => (
                    <tr
                      key={cls.id}
                      className={`acl-table-row${selectedRow?.id === cls.id ? ' acl-table-row--selected' : ''}`}
                      onClick={() => handleRowClick(cls)}
                    >
                      <td className="acl-td-num">{String(idx + 1).padStart(2, '0')}</td>
                      <td className="acl-td-id">{cls.id}</td>
                      <td className="acl-td-name">{cls.name}</td>
                      <td>
                        <span className="acl-cat-chip">
                          <span className="acl-cat-chip-dot"></span>
                          {cls.category_name || `#${cls.category_id}`}
                        </span>
                      </td>
                      <td>
                        {cls.group_name && (
                          <span className="acl-group-chip">
                            <span className="acl-group-chip-dot"></span>
                            {cls.group_name}
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={`acl-status${cls.is_active ? ' acl-status--active' : ' acl-status--inactive'}`}>
                          <span className="acl-status-dot"></span>
                          {cls.is_active ? 'Active' : 'Inactive'}
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
            <div className="acl-selected-bar">
              <span className="acl-selected-bar-dot"></span>
              <span className="acl-selected-bar-text">
                Selected: <strong>{selectedRow.name}</strong>
              </span>
              {selectedRow.category_name && (
                <span className="acl-selected-bar-cat">
                  {selectedRow.category_name}
                </span>
              )}
              {selectedRow.group_name && (
                <span className="acl-selected-bar-group">
                  {selectedRow.group_name}
                </span>
              )}
              <span className="acl-selected-bar-id">ID #{selectedRow.id}</span>
            </div>
          )}
        </section>

      </div>
    </div>
  );
};

export default AccountClass;