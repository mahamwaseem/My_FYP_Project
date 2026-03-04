// src/COA/Accountcategory.jsx  —  PREMIUM LIGHT TEAL EDITION
import React from 'react';
import useAccountCategory from './Useaccountcategory';
import './Accountcategory.css';

const SaveIcon   = () => (<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>);
const EditIcon   = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>);
const DeleteIcon = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>);
const ClearIcon  = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>);
const BackIcon   = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>);
const LoaderIcon = () => (<svg className="ac-spinner" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>);

const AccountCategory = ({ onBack }) => {
  const {
    categories, groups, form, editingId, selectedRow,
    loading, saving, error, successMsg, nextId,
    handleChange, handleSave, handleEdit, handleDelete,
    resetForm, handleRowClick,
  } = useAccountCategory();

  return (
    <div className="ac-page">

      {/* ── HEADER ── */}
      <header className="ac-header">
        <div className="ac-header-inner">
          {onBack && (
            <button className="ac-back-btn" onClick={onBack}>
              <BackIcon /> Home
            </button>
          )}
          <div className="ac-header-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <div className="ac-header-text">
            <h1 className="ac-header-title">Account Category</h1>
            <p className="ac-header-sub">Chart of Accounts · Category Management</p>
          </div>
          <div className="ac-header-meta">
            <div className="ac-header-stat">
              <div className="ac-header-stat-num">{loading ? '—' : categories.length}</div>
              <div className="ac-header-stat-label">Total Categories</div>
            </div>
          </div>
        </div>
      </header>

      {/* ── TOASTS ── */}
      {error && (
        <div className="ac-toast ac-toast--error">
          <div className="ac-toast-icon">✕</div><span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="ac-toast ac-toast--success">
          <div className="ac-toast-icon">✓</div><span>{successMsg}</span>
        </div>
      )}

      <div className="ac-content">

        {/* ── FORM PANEL ── */}
        <aside className="ac-panel ac-form-panel">
          <div className="ac-panel-head">
            <div className="ac-panel-eyebrow">
              <span className="ac-panel-badge">
                <span className="ac-panel-badge-dot"></span>
                {editingId ? 'Edit Mode' : 'Add New'}
              </span>
            </div>
            <h2 className="ac-panel-title">Category Details</h2>
          </div>

          <div className="ac-form">
            <div className="ac-field">
              <label className="ac-label">Category ID</label>
              <div className="ac-input-wrap">
                <input className="ac-input ac-input--readonly"
                  type="text" value={editingId || nextId} readOnly />
                <span className="ac-input-badge">Auto</span>
              </div>
            </div>

            <div className="ac-field">
              <label className="ac-label">Group <span className="ac-required">*</span></label>
              <select className="ac-input ac-select" name="group_id"
  value={form.group_id} onChange={handleChange}>
  {groups.length === 0
    ? <option value="">Loading…</option>
    : groups.map(g => (
        <option key={g.id} value={String(g.id)}>{g.name}</option>
      ))
  }
</select>
            </div>

            <div className="ac-field">
              <label className="ac-label">Category Name <span className="ac-required">*</span></label>
              <input className="ac-input" type="text" name="name"
                value={form.name} onChange={handleChange}
                placeholder="e.g. Fixed Assets, Revenue…" autoComplete="off" />
            </div>

            <div className="ac-field ac-field--inline">
              <label className="ac-checkbox-label">
                <input type="checkbox" name="is_active" className="ac-checkbox"
                  checked={form.is_active} onChange={handleChange} />
                <span className="ac-checkbox-custom"></span>
                Active
              </label>
            </div>
          </div>

          <div className="ac-actions">
            <button className="ac-btn ac-btn--save" onClick={handleSave} disabled={saving}>
              {saving ? <LoaderIcon /> : <SaveIcon />}
              <span>{saving ? 'Saving…' : editingId ? 'Update Category' : 'Save Category'}</span>
            </button>
            <div className="ac-btn-row">
              <button className="ac-btn ac-btn--edit" onClick={handleEdit} disabled={!selectedRow}>
                <EditIcon /><span>Edit</span>
              </button>
              <button className="ac-btn ac-btn--delete" onClick={handleDelete} disabled={!selectedRow}>
                <DeleteIcon /><span>Delete</span>
              </button>
            </div>
            <button className="ac-btn ac-btn--clear" onClick={resetForm}>
              <ClearIcon /><span>Clear Form</span>
            </button>
          </div>
        </aside>

        {/* ── TABLE PANEL ── */}
        <section className="ac-panel ac-table-panel">
          <div className="ac-panel-head ac-panel-head--row">
            <div>
              <div className="ac-panel-eyebrow">
                <span className="ac-panel-badge">
                  <span className="ac-panel-badge-dot"></span>Records
                </span>
              </div>
              <h2 className="ac-panel-title">Categories List</h2>
            </div>
            <div className="ac-count-pill">
              <span className="ac-count-dot"></span>
              {loading ? '…' : categories.length}&nbsp;
              {categories.length === 1 ? 'category' : 'categories'}
            </div>
          </div>

          <div className="ac-table-wrapper">
            {loading ? (
              <div className="ac-empty">
                <div className="ac-empty-icon"><LoaderIcon /></div>
                <p className="ac-empty-title">Loading records…</p>
              </div>
            ) : categories.length === 0 ? (
              <div className="ac-empty">
                <div className="ac-empty-icon">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                  </svg>
                </div>
                <p className="ac-empty-title">No categories yet</p>
                <p className="ac-empty-sub">Add your first category using the form.</p>
              </div>
            ) : (
              <table className="ac-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Category ID</th>
                    <th>Category Name</th>
                    <th>Group</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((cat, idx) => {
                    const grp = groups.find(g => g.id === cat.group_id);
                    return (
                      <tr key={cat.id}
                        className={`ac-table-row${selectedRow?.id === cat.id ? ' ac-table-row--selected' : ''}`}
                        onClick={() => handleRowClick(cat)}
                      >
                        <td className="ac-td-num">{String(idx + 1).padStart(2, '0')}</td>
                        <td className="ac-td-id">{cat.id}</td>
                        <td className="ac-td-name">{cat.name}</td>
                        <td>
                          <span className="ac-group-chip">
                            <span className="ac-group-chip-dot"></span>
                            {grp ? grp.name : `#${cat.group_id}`}
                          </span>
                        </td>
                        <td>
                          <span className={`ac-status${cat.is_active ? ' ac-status--active' : ' ac-status--inactive'}`}>
                            <span className="ac-status-dot"></span>
                            {cat.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {selectedRow && (
            <div className="ac-selected-bar">
              <span className="ac-selected-bar-dot"></span>
              <span className="ac-selected-bar-text">
                Selected: <strong>{selectedRow.name}</strong>
              </span>
              {groups.find(g => g.id === selectedRow.group_id) && (
                <span className="ac-selected-bar-group">
                  {groups.find(g => g.id === selectedRow.group_id).name}
                </span>
              )}
              <span className="ac-selected-bar-id">ID #{selectedRow.id}</span>
            </div>
          )}
        </section>

      </div>
    </div>
  );
};

export default AccountCategory;