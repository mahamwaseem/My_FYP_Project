// src/COA/Accountgroup.jsx  —  PREMIUM LIGHT TEAL EDITION
import React from 'react';
import useAccountGroup from './Useaccountgroup';
import './Accountgroup.css';

const SaveIcon   = () => (<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>);
const EditIcon   = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>);
const DeleteIcon = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>);
const ClearIcon  = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>);
const BackIcon   = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>);
const LoaderIcon = () => (<svg className="ag-spinner" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>);

const AccountGroup = ({ onBack }) => {
  const {
    groups, form, editingId, selectedRow,
    loading, saving, error, successMsg, nextId,
    handleChange, handleSave, handleEdit, handleDelete,
    resetForm, handleRowClick,
  } = useAccountGroup();

  return (
    <div className="ag-page">

      {/* ── HEADER ── */}
      <header className="ag-header">
        <div className="ag-header-inner">
          {onBack && (
            <button className="ag-back-btn" onClick={onBack}>
              <BackIcon /> Home
            </button>
          )}
          <div className="ag-header-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <div className="ag-header-text">
            <h1 className="ag-header-title">Account Group</h1>
            <p className="ag-header-sub">Chart of Accounts · Group Management</p>
          </div>
          <div className="ag-header-meta">
            <div className="ag-header-stat">
              <div className="ag-header-stat-num">{loading ? '—' : groups.length}</div>
              <div className="ag-header-stat-label">Total Groups</div>
            </div>
          </div>
        </div>
      </header>

      {/* ── TOASTS ── */}
      {error && (
        <div className="ag-toast ag-toast--error">
          <div className="ag-toast-icon">✕</div>
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="ag-toast ag-toast--success">
          <div className="ag-toast-icon">✓</div>
          <span>{successMsg}</span>
        </div>
      )}

      {/* ── MAIN CONTENT ── */}
      <div className="ag-content">

        {/* ── FORM PANEL ── */}
        <aside className="ag-panel ag-form-panel">
          <div className="ag-panel-head">
            <div className="ag-panel-eyebrow">
              <span className="ag-panel-badge">
                <span className="ag-panel-badge-dot"></span>
                {editingId ? 'Edit Mode' : 'Add New'}
              </span>
            </div>
            <h2 className="ag-panel-title">Group Details</h2>
          </div>

          <div className="ag-form">
            <div className="ag-field">
              <label className="ag-label">Group ID</label>
              <div className="ag-input-wrap">
                <input className="ag-input ag-input--readonly"
                  type="text" value={editingId || nextId} readOnly />
                <span className="ag-input-badge">Auto</span>
              </div>
            </div>

            <div className="ag-field">
              <label className="ag-label">Location ID</label>
              <input className="ag-input" type="number" name="location_id"
                value={form.location_id} onChange={handleChange} min="1" />
            </div>

            <div className="ag-field">
              <label className="ag-label">
                Group Name <span className="ag-required">*</span>
              </label>
              <input className="ag-input" type="text" name="name"
                value={form.name} onChange={handleChange}
                placeholder="e.g. Assets, Liability…" autoComplete="off" />
            </div>
          </div>

          <div className="ag-actions">
            <button className="ag-btn ag-btn--save" onClick={handleSave} disabled={saving}>
              {saving ? <LoaderIcon /> : <SaveIcon />}
              <span>{saving ? 'Saving…' : editingId ? 'Update Group' : 'Save Group'}</span>
            </button>
            <div className="ag-btn-row">
              <button className="ag-btn ag-btn--edit" onClick={handleEdit} disabled={!selectedRow}>
                <EditIcon /><span>Edit</span>
              </button>
              <button className="ag-btn ag-btn--delete" onClick={handleDelete} disabled={!selectedRow}>
                <DeleteIcon /><span>Delete</span>
              </button>
            </div>
            <button className="ag-btn ag-btn--clear" onClick={resetForm}>
              <ClearIcon /><span>Clear Form</span>
            </button>
          </div>
        </aside>

        {/* ── TABLE PANEL ── */}
        <section className="ag-panel ag-table-panel">
          <div className="ag-panel-head ag-panel-head--row">
            <div>
              <div className="ag-panel-eyebrow">
                <span className="ag-panel-badge">
                  <span className="ag-panel-badge-dot"></span>
                  Records
                </span>
              </div>
              <h2 className="ag-panel-title">Groups List</h2>
            </div>
            <div className="ag-count-pill">
              <span className="ag-count-dot"></span>
              {loading ? '…' : groups.length}&nbsp;
              {groups.length === 1 ? 'group' : 'groups'}
            </div>
          </div>

          <div className="ag-table-wrapper">
            {loading ? (
              <div className="ag-empty">
                <div className="ag-empty-icon"><LoaderIcon /></div>
                <p className="ag-empty-title">Loading records…</p>
              </div>
            ) : groups.length === 0 ? (
              <div className="ag-empty">
                <div className="ag-empty-icon">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <rect x="3" y="3" width="18" height="18" rx="3"/>
                    <line x1="3" y1="9" x2="21" y2="9"/>
                    <line x1="9" y1="21" x2="9" y2="9"/>
                  </svg>
                </div>
                <p className="ag-empty-title">No groups yet</p>
                <p className="ag-empty-sub">Add your first account group using the form.</p>
              </div>
            ) : (
              <table className="ag-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Group ID</th>
                    <th>Group Name</th>
                    <th>Location</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.map((g, idx) => (
                    <tr key={g.id}
                      className={`ag-table-row${selectedRow?.id === g.id ? ' ag-table-row--selected' : ''}`}
                      onClick={() => handleRowClick(g)}
                    >
                      <td className="ag-td-num">{String(idx + 1).padStart(2, '0')}</td>
                      <td className="ag-td-id">{g.id}</td>
                      <td className="ag-td-name">{g.name}</td>
                      <td className="ag-td-loc">{g.location_id}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {selectedRow && (
            <div className="ag-selected-bar">
              <span className="ag-selected-bar-dot"></span>
              <span className="ag-selected-bar-text">
                Selected: <strong>{selectedRow.name}</strong>
              </span>
              <span className="ag-selected-bar-id">ID #{selectedRow.id}</span>
            </div>
          )}
        </section>

      </div>
    </div>
  );
};

export default AccountGroup;