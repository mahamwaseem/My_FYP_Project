import { useState } from "react";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&family=Instrument+Serif:ital@0;1&display=swap');

  *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

  :root {
    --teal: #0d9488;
    --teal-light: #14b8a6;
    --teal-dark: #0f766e;
    --teal-glow: rgba(13,148,136,0.12);
    --navy: #0f172a;
    --slate: #1e293b;
    --muted: #64748b;
    --border: #e2e8f0;
    --bg: #f8fafc;
    --white: #ffffff;
    --danger: #ef4444;
    --success: #10b981;
    --warn: #f59e0b;
  }

  body { font-family: 'Plus Jakarta Sans', sans-serif; background: var(--bg); color: var(--navy); }

  .coa-wrapper {
    min-height: 100vh;
    background: linear-gradient(135deg, #f0fdfc 0%, #f8fafc 60%, #ffffff 100%);
    padding: 0;
  }

  /* TOP NAV */
  .coa-topbar {
    background: white;
    border-bottom: 1px solid var(--border);
    padding: 0 32px;
    height: 64px;
    display: flex; align-items: center; justify-content: space-between;
    box-shadow: 0 1px 8px rgba(0,0,0,0.06);
    position: sticky; top: 0; z-index: 100;
  }

  .topbar-left { display: flex; align-items: center; gap: 12px; }
  .topbar-logo {
    width: 36px; height: 36px;
    background: linear-gradient(135deg, var(--teal), var(--teal-dark));
    border-radius: 10px; display: flex; align-items: center; justify-content: center;
    color: white; font-weight: 900; font-size: 16px;
    box-shadow: 0 4px 12px rgba(13,148,136,0.35);
  }
  .topbar-title { font-size: 1.1rem; font-weight: 800; color: var(--navy); }
  .topbar-sub { font-size: 0.75rem; color: var(--muted); font-weight: 500; }

  .breadcrumb {
    display: flex; align-items: center; gap: 6px;
    font-size: 0.8rem; color: var(--muted);
  }
  .breadcrumb-item { font-weight: 600; }
  .breadcrumb-item.active { color: var(--teal); }
  .breadcrumb-sep { opacity: 0.4; }

  /* TAB NAV */
  .coa-tabnav {
    background: white;
    border-bottom: 1px solid var(--border);
    padding: 0 32px;
    display: flex; gap: 0;
  }

  .tab-btn {
    padding: 16px 28px;
    font-size: 0.875rem; font-weight: 700;
    color: var(--muted);
    background: transparent; border: none;
    border-bottom: 3px solid transparent;
    cursor: pointer; font-family: inherit;
    display: flex; align-items: center; gap: 8px;
    transition: all 0.2s;
    position: relative;
  }

  .tab-btn:hover { color: var(--teal); }

  .tab-btn.active {
    color: var(--teal);
    border-bottom-color: var(--teal);
  }

  .tab-badge {
    background: var(--teal-glow); color: var(--teal);
    font-size: 0.7rem; font-weight: 800;
    padding: 2px 7px; border-radius: 100px;
    min-width: 20px; text-align: center;
  }

  .tab-btn.active .tab-badge { background: var(--teal); color: white; }

  .tab-icon { font-size: 1rem; }

  /* MAIN BODY */
  .coa-body {
    padding: 28px 32px;
    display: grid;
    grid-template-columns: 340px 1fr;
    gap: 24px;
    align-items: start;
  }

  /* LEFT PANEL - ADD/EDIT FORM */
  .form-panel {
    background: white;
    border-radius: 16px;
    border: 1.5px solid var(--border);
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0,0,0,0.06);
    position: sticky; top: 100px;
  }

  .form-panel-header {
    background: linear-gradient(135deg, var(--teal), var(--teal-dark));
    padding: 18px 22px;
    display: flex; align-items: center; gap: 12px;
  }

  .form-panel-icon {
    width: 36px; height: 36px; background: rgba(255,255,255,0.2);
    border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 16px;
  }

  .form-panel-title { color: white; font-size: 0.95rem; font-weight: 700; }
  .form-panel-sub { color: rgba(255,255,255,0.75); font-size: 0.72rem; font-weight: 500; margin-top: 1px; }

  .form-body { padding: 22px; }

  .form-group { margin-bottom: 18px; }

  .form-label {
    display: block; font-size: 0.78rem; font-weight: 700;
    color: var(--slate); margin-bottom: 7px; letter-spacing: 0.03em;
    text-transform: uppercase;
  }

  .form-input {
    width: 100%; padding: 10px 14px;
    border: 1.5px solid var(--border); border-radius: 9px;
    font-size: 0.875rem; font-family: inherit; color: var(--navy);
    background: var(--bg);
    transition: all 0.2s; outline: none;
  }

  .form-input:focus { border-color: var(--teal); background: white; box-shadow: 0 0 0 3px rgba(13,148,136,0.1); }
  .form-input:disabled { background: #f1f5f9; color: var(--muted); cursor: not-allowed; }

  .form-select {
    width: 100%; padding: 10px 14px;
    border: 1.5px solid var(--border); border-radius: 9px;
    font-size: 0.875rem; font-family: inherit; color: var(--navy);
    background: var(--bg); cursor: pointer;
    transition: all 0.2s; outline: none;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2364748b' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 12px center;
  }
  .form-select:focus { border-color: var(--teal); box-shadow: 0 0 0 3px rgba(13,148,136,0.1); background-color: white; }

  .form-checkbox-row {
    display: flex; align-items: center; gap: 10px; padding: 4px 0;
  }

  .form-checkbox {
    width: 18px; height: 18px; accent-color: var(--teal); cursor: pointer;
  }

  .form-checkbox-label { font-size: 0.875rem; font-weight: 600; color: var(--slate); cursor: pointer; }

  .id-badge {
    display: inline-flex; align-items: center; gap: 6px;
    background: rgba(13,148,136,0.08); color: var(--teal-dark);
    border: 1px solid rgba(13,148,136,0.2);
    padding: 8px 14px; border-radius: 8px;
    font-size: 0.875rem; font-weight: 700;
  }

  /* FORM ACTIONS */
  .form-actions {
    padding: 16px 22px;
    border-top: 1px solid var(--border);
    display: flex; gap: 10px;
    background: var(--bg);
  }

  .btn-save {
    flex: 1; padding: 10px 16px;
    background: linear-gradient(135deg, var(--teal-light), var(--teal-dark));
    color: white; border: none; border-radius: 9px;
    font-size: 0.875rem; font-weight: 700; cursor: pointer; font-family: inherit;
    display: flex; align-items: center; justify-content: center; gap: 7px;
    transition: all 0.2s;
    box-shadow: 0 4px 12px rgba(13,148,136,0.3);
  }
  .btn-save:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(13,148,136,0.4); }

  .btn-add {
    flex: 1; padding: 10px 16px;
    background: white; color: var(--teal);
    border: 1.5px solid var(--teal); border-radius: 9px;
    font-size: 0.875rem; font-weight: 700; cursor: pointer; font-family: inherit;
    display: flex; align-items: center; justify-content: center; gap: 7px;
    transition: all 0.2s;
  }
  .btn-add:hover { background: var(--teal-glow); }

  .btn-cancel {
    padding: 10px 14px;
    background: white; color: var(--danger);
    border: 1.5px solid #fecaca; border-radius: 9px;
    font-size: 0.875rem; font-weight: 700; cursor: pointer; font-family: inherit;
    display: flex; align-items: center; justify-content: center; gap: 6px;
    transition: all 0.2s;
  }
  .btn-cancel:hover { background: #fef2f2; border-color: var(--danger); }

  /* RIGHT PANEL - TABLE */
  .table-panel {
    background: white;
    border-radius: 16px;
    border: 1.5px solid var(--border);
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0,0,0,0.06);
  }

  .table-panel-header {
    padding: 18px 24px;
    border-bottom: 1px solid var(--border);
    display: flex; align-items: center; justify-content: space-between;
  }

  .table-panel-title { font-size: 1rem; font-weight: 800; color: var(--navy); }
  .table-panel-count { font-size: 0.8rem; color: var(--muted); font-weight: 500; margin-top: 2px; }

  .table-search {
    padding: 8px 14px 8px 36px;
    border: 1.5px solid var(--border); border-radius: 8px;
    font-size: 0.825rem; font-family: inherit; color: var(--navy);
    background: var(--bg); outline: none; transition: all 0.2s;
    width: 200px;
  }
  .table-search:focus { border-color: var(--teal); background: white; width: 240px; }
  .search-wrap { position: relative; }
  .search-icon { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); color: var(--muted); font-size: 13px; }

  .data-table { width: 100%; border-collapse: collapse; }

  .data-table thead tr {
    background: linear-gradient(90deg, #f0fdfc, #f8fafc);
    border-bottom: 2px solid var(--border);
  }

  .data-table th {
    padding: 12px 16px;
    text-align: left; font-size: 0.72rem; font-weight: 800;
    color: var(--muted); text-transform: uppercase; letter-spacing: 0.07em;
    white-space: nowrap;
  }

  .data-table th:first-child { padding-left: 20px; }

  .data-table tbody tr {
    border-bottom: 1px solid #f1f5f9;
    transition: all 0.15s;
    cursor: pointer;
  }

  .data-table tbody tr:hover { background: rgba(13,148,136,0.04); }

  .data-table tbody tr.selected {
    background: rgba(13,148,136,0.08);
    border-left: 3px solid var(--teal);
  }

  .data-table td {
    padding: 13px 16px;
    font-size: 0.875rem; color: var(--slate);
    font-weight: 500;
  }

  .data-table td:first-child { padding-left: 20px; }

  .td-id {
    font-size: 0.78rem; font-weight: 800; color: var(--muted);
    font-variant-numeric: tabular-nums;
  }

  .td-name { font-weight: 700; color: var(--navy); }

  .td-group {
    display: inline-flex; align-items: center; gap: 5px;
    background: var(--teal-glow); color: var(--teal-dark);
    border: 1px solid rgba(13,148,136,0.2);
    padding: 3px 10px; border-radius: 100px;
    font-size: 0.75rem; font-weight: 700;
  }

  .td-active-yes {
    display: inline-flex; align-items: center; gap: 4px;
    background: #dcfce7; color: #166534;
    padding: 3px 10px; border-radius: 100px;
    font-size: 0.75rem; font-weight: 700;
  }

  .td-active-no {
    display: inline-flex; align-items: center; gap: 4px;
    background: #f1f5f9; color: var(--muted);
    padding: 3px 10px; border-radius: 100px;
    font-size: 0.75rem; font-weight: 700;
  }

  .row-actions { display: flex; gap: 6px; opacity: 0; transition: opacity 0.2s; }
  .data-table tbody tr:hover .row-actions { opacity: 1; }
  .data-table tbody tr.selected .row-actions { opacity: 1; }

  .btn-row-edit {
    padding: 5px 10px; background: var(--teal-glow); color: var(--teal);
    border: 1px solid rgba(13,148,136,0.2); border-radius: 6px;
    font-size: 0.72rem; font-weight: 700; cursor: pointer; font-family: inherit;
    transition: all 0.15s;
  }
  .btn-row-edit:hover { background: var(--teal); color: white; }

  .btn-row-delete {
    padding: 5px 10px; background: #fef2f2; color: var(--danger);
    border: 1px solid #fecaca; border-radius: 6px;
    font-size: 0.72rem; font-weight: 700; cursor: pointer; font-family: inherit;
    transition: all 0.15s;
  }
  .btn-row-delete:hover { background: var(--danger); color: white; }

  .empty-state {
    text-align: center; padding: 60px 20px;
  }
  .empty-icon { font-size: 3rem; margin-bottom: 12px; opacity: 0.4; }
  .empty-title { font-size: 1rem; font-weight: 700; color: var(--muted); margin-bottom: 6px; }
  .empty-sub { font-size: 0.85rem; color: #94a3b8; }

  .table-footer {
    padding: 14px 20px;
    border-top: 1px solid var(--border);
    background: var(--bg);
    display: flex; align-items: center; justify-content: space-between;
  }
  .table-footer-text { font-size: 0.78rem; color: var(--muted); font-weight: 600; }

  /* TOAST */
  .toast {
    position: fixed; bottom: 28px; right: 28px; z-index: 9999;
    background: var(--navy); color: white;
    padding: 14px 20px; border-radius: 12px;
    font-size: 0.875rem; font-weight: 600;
    display: flex; align-items: center; gap: 10px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.2);
    animation: slideUp 0.3s ease;
    border-left: 4px solid var(--teal);
  }
  @keyframes slideUp {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }

  /* MODE INDICATOR */
  .mode-badge {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 4px 12px; border-radius: 100px;
    font-size: 0.72rem; font-weight: 800;
    text-transform: uppercase; letter-spacing: 0.05em;
  }
  .mode-add { background: #dcfce7; color: #166534; }
  .mode-edit { background: #fef9c3; color: #92400e; }

  .form-divider {
    height: 1px; background: var(--border); margin: 16px 0;
  }

  @media (max-width: 900px) {
    .coa-body { grid-template-columns: 1fr; }
    .form-panel { position: relative; top: 0; }
    .coa-topbar, .coa-tabnav { padding: 0 16px; }
    .coa-body { padding: 16px; }
  }
`;

const TABS = [
  { id: 'group',    label: 'Group',    icon: '🏛️', desc: 'Top-level account groups' },
  { id: 'category', label: 'Category', icon: '📂', desc: 'Grouped account categories' },
  { id: 'class',    label: 'Class',    icon: '🗂️', desc: 'Category classifications' },
  { id: 'account',  label: 'Account',  icon: '💳', desc: 'Individual GL accounts' },
];

const nextId = (items, prefix = '') => {
  if (!items.length) return prefix ? `${prefix}001` : 1;
  const nums = items.map(i => typeof i.id === 'number' ? i.id : parseInt(i.id));
  return prefix ? `${prefix}${String(Math.max(...nums) + 1).padStart(3,'0')}` : Math.max(...nums) + 1;
};

export default function ChartOfAccounts() {
  const [activeTab, setActiveTab] = useState('group');
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedRow, setSelectedRow] = useState(null);
  const [editMode, setEditMode] = useState(false);

  // DATA STORES
  const [groups, setGroups] = useState([
    { id: 1, name: 'Assets' },
    { id: 2, name: 'Capital' },
    { id: 3, name: 'Liability' },
    { id: 4, name: 'Income' },
    { id: 5, name: 'Expense' },
  ]);

  const [categories, setCategories] = useState([
    { id: 11, name: 'Fixed Assets',        groupId: 1, active: true },
    { id: 12, name: 'Current Assets',      groupId: 1, active: true },
    { id: 21, name: 'Owner Capital',       groupId: 2, active: false },
    { id: 31, name: 'Short Term Liability',groupId: 3, active: true },
    { id: 41, name: 'Revenue',             groupId: 4, active: true },
    { id: 51, name: 'Trading Expense',     groupId: 5, active: true },
    { id: 52, name: 'General Expense',     groupId: 5, active: true },
  ]);

  const [classes, setClasses] = useState([
    { id: 101, name: 'Tangible Assets',    categoryId: 11, active: true },
    { id: 102, name: 'Intangible Assets',  categoryId: 11, active: true },
    { id: 201, name: 'Cash & Equivalents', categoryId: 12, active: true },
    { id: 301, name: 'Sales Revenue',      categoryId: 41, active: true },
  ]);

  const [accounts, setAccounts] = useState([
    { id: 1001, name: 'Cash in Hand',      classId: 201, code: '1001', active: true },
    { id: 1002, name: 'Bank Account',      classId: 201, code: '1002', active: true },
    { id: 4001, name: 'Product Sales',     classId: 301, code: '4001', active: true },
  ]);

  // FORM STATE per tab
  const emptyForms = {
    group:    { name: '' },
    category: { name: '', groupId: '', active: true },
    class:    { name: '', categoryId: '', active: true },
    account:  { name: '', classId: '', code: '', active: true },
  };

  const [form, setForm] = useState({ ...emptyForms.group });

  const showToast = (msg, icon = '✅') => {
    setToast({ msg, icon });
    setTimeout(() => setToast(null), 2800);
  };

  const resetForm = () => {
    setForm({ ...emptyForms[activeTab] });
    setSelectedRow(null);
    setEditMode(false);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setForm({ ...emptyForms[tab] });
    setSelectedRow(null);
    setEditMode(false);
    setSearch('');
  };

  const handleRowClick = (row) => {
    setSelectedRow(row.id);
    setEditMode(true);
    if (activeTab === 'group')    setForm({ name: row.name });
    if (activeTab === 'category') setForm({ name: row.name, groupId: row.groupId, active: row.active });
    if (activeTab === 'class')    setForm({ name: row.name, categoryId: row.categoryId, active: row.active });
    if (activeTab === 'account')  setForm({ name: row.name, classId: row.classId, code: row.code, active: row.active });
  };

  const handleSave = () => {
    if (!form.name?.trim()) { showToast('Name is required', '⚠️'); return; }

    if (activeTab === 'group') {
      if (editMode) {
        setGroups(g => g.map(x => x.id === selectedRow ? { ...x, name: form.name } : x));
        showToast('Group updated successfully');
      } else {
        setGroups(g => [...g, { id: nextId(g), name: form.name }]);
        showToast('Group added successfully');
      }
    }

    if (activeTab === 'category') {
      if (!form.groupId) { showToast('Please select a Group', '⚠️'); return; }
      if (editMode) {
        setCategories(c => c.map(x => x.id === selectedRow ? { ...x, ...form, groupId: Number(form.groupId) } : x));
        showToast('Category updated successfully');
      } else {
        const newId = nextId(categories);
        setCategories(c => [...c, { id: newId, ...form, groupId: Number(form.groupId) }]);
        showToast('Category added successfully');
      }
    }

    if (activeTab === 'class') {
      if (!form.categoryId) { showToast('Please select a Category', '⚠️'); return; }
      if (editMode) {
        setClasses(c => c.map(x => x.id === selectedRow ? { ...x, ...form, categoryId: Number(form.categoryId) } : x));
        showToast('Class updated successfully');
      } else {
        setClasses(c => [...c, { id: nextId(c), ...form, categoryId: Number(form.categoryId) }]);
        showToast('Class added successfully');
      }
    }

    if (activeTab === 'account') {
      if (!form.classId) { showToast('Please select a Class', '⚠️'); return; }
      if (editMode) {
        setAccounts(a => a.map(x => x.id === selectedRow ? { ...x, ...form, classId: Number(form.classId) } : x));
        showToast('Account updated successfully');
      } else {
        setAccounts(a => [...a, { id: nextId(a), ...form, classId: Number(form.classId) }]);
        showToast('Account added successfully');
      }
    }

    resetForm();
  };

  const handleDelete = (id) => {
    if (activeTab === 'group')    setGroups(g => g.filter(x => x.id !== id));
    if (activeTab === 'category') setCategories(c => c.filter(x => x.id !== id));
    if (activeTab === 'class')    setClasses(c => c.filter(x => x.id !== id));
    if (activeTab === 'account')  setAccounts(a => a.filter(x => x.id !== id));
    if (selectedRow === id) resetForm();
    showToast('Record deleted', '🗑️');
  };

  // CURRENT DATA
  const currentData = () => {
    const s = search.toLowerCase();
    if (activeTab === 'group')    return groups.filter(x => x.name.toLowerCase().includes(s));
    if (activeTab === 'category') return categories.filter(x => x.name.toLowerCase().includes(s));
    if (activeTab === 'class')    return classes.filter(x => x.name.toLowerCase().includes(s));
    if (activeTab === 'account')  return accounts.filter(x => x.name.toLowerCase().includes(s) || x.code?.toLowerCase().includes(s));
    return [];
  };

  const currentId = () => {
    if (editMode && selectedRow) return selectedRow;
    if (activeTab === 'group')    return nextId(groups);
    if (activeTab === 'category') return nextId(categories);
    if (activeTab === 'class')    return nextId(classes);
    if (activeTab === 'account')  return nextId(accounts);
    return '';
  };

  const getGroupName = (id) => groups.find(g => g.id === Number(id))?.name || '-';
  const getCategoryName = (id) => categories.find(c => c.id === Number(id))?.name || '-';
  const getClassName = (id) => classes.find(c => c.id === Number(id))?.name || '-';

  const tabInfo = TABS.find(t => t.id === activeTab);
  const rows = currentData();

  return (
    <>
      <style>{styles}</style>
      <div className="coa-wrapper">

        {/* TOP BAR */}
        <div className="coa-topbar">
          <div className="topbar-left">
            <div className="topbar-logo">F</div>
            <div>
              <div className="topbar-title">FinTrack</div>
              <div className="topbar-sub">Chart of Accounts</div>
            </div>
          </div>
          <div className="breadcrumb">
            <span className="breadcrumb-item">Dashboard</span>
            <span className="breadcrumb-sep">›</span>
            <span className="breadcrumb-item">COA</span>
            <span className="breadcrumb-sep">›</span>
            <span className="breadcrumb-item active">{tabInfo.label}</span>
          </div>
        </div>

        {/* TAB NAV */}
        <div className="coa-tabnav">
          {TABS.map(tab => {
            const count = tab.id === 'group' ? groups.length : tab.id === 'category' ? categories.length : tab.id === 'class' ? classes.length : accounts.length;
            return (
              <button
                key={tab.id}
                className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => handleTabChange(tab.id)}
              >
                <span className="tab-icon">{tab.icon}</span>
                {tab.label}
                <span className="tab-badge">{count}</span>
              </button>
            );
          })}
        </div>

        {/* BODY */}
        <div className="coa-body">

          {/* LEFT: FORM */}
          <div className="form-panel">
            <div className="form-panel-header">
              <div className="form-panel-icon">{tabInfo.icon}</div>
              <div>
                <div className="form-panel-title">{editMode ? `Edit ${tabInfo.label}` : `Add ${tabInfo.label}`}</div>
                <div className="form-panel-sub">{tabInfo.desc}</div>
              </div>
              <div style={{ marginLeft: 'auto' }}>
                <span className={`mode-badge ${editMode ? 'mode-edit' : 'mode-add'}`}>
                  {editMode ? '✏️ Edit' : '+ New'}
                </span>
              </div>
            </div>

            <div className="form-body">
              {/* ID FIELD */}
              <div className="form-group">
                <label className="form-label">{tabInfo.label} ID</label>
                <div className="id-badge">
                  <span>🔢</span>
                  <span>{currentId()}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--muted)', fontWeight: 500 }}>(auto)</span>
                </div>
              </div>

              <div className="form-divider"></div>

              {/* CATEGORY: GROUP dropdown */}
              {activeTab === 'category' && (
                <div className="form-group">
                  <label className="form-label">Group *</label>
                  <select className="form-select" value={form.groupId} onChange={e => setForm(f => ({ ...f, groupId: e.target.value }))}>
                    <option value="">— Select Group —</option>
                    {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </div>
              )}

              {/* CLASS: CATEGORY dropdown */}
              {activeTab === 'class' && (
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select className="form-select" value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}>
                    <option value="">— Select Category —</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({getGroupName(c.groupId)})</option>
                    ))}
                  </select>
                </div>
              )}

              {/* ACCOUNT: CLASS dropdown + CODE */}
              {activeTab === 'account' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Class *</label>
                    <select className="form-select" value={form.classId} onChange={e => setForm(f => ({ ...f, classId: e.target.value }))}>
                      <option value="">— Select Class —</option>
                      {classes.map(c => (
                        <option key={c.id} value={c.id}>{c.name} ({getCategoryName(c.categoryId)})</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Account Code</label>
                    <input className="form-input" placeholder="e.g. 1001" value={form.code || ''} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} />
                  </div>
                </>
              )}

              {/* NAME */}
              <div className="form-group">
                <label className="form-label">Name *</label>
                <input
                  className="form-input"
                  placeholder={`Enter ${tabInfo.label} name...`}
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && handleSave()}
                />
              </div>

              {/* ACTIVE toggle for category/class/account */}
              {(activeTab === 'category' || activeTab === 'class' || activeTab === 'account') && (
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <div className="form-checkbox-row">
                    <input
                      type="checkbox"
                      className="form-checkbox"
                      id="active-check"
                      checked={form.active}
                      onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
                    />
                    <label htmlFor="active-check" className="form-checkbox-label">Active</label>
                  </div>
                </div>
              )}
            </div>

            <div className="form-actions">
              <button className="btn-save" onClick={handleSave}>
                <span>💾</span> {editMode ? 'Update' : 'Save'}
              </button>
              {editMode && (
                <button className="btn-cancel" onClick={resetForm} title="Cancel edit">
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* RIGHT: TABLE */}
          <div className="table-panel">
            <div className="table-panel-header">
              <div>
                <div className="table-panel-title">{tabInfo.icon} {tabInfo.label} List</div>
                <div className="table-panel-count">{rows.length} record{rows.length !== 1 ? 's' : ''}{search ? ' (filtered)' : ''}</div>
              </div>
              <div className="search-wrap">
                <span className="search-icon">🔍</span>
                <input
                  className="table-search"
                  placeholder="Search..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>

            {rows.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">{tabInfo.icon}</div>
                <div className="empty-title">No {tabInfo.label}s found</div>
                <div className="empty-sub">{search ? 'Try a different search term' : `Add your first ${tabInfo.label} using the form on the left`}</div>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    {activeTab === 'account' && <th>Code</th>}
                    <th>Name</th>
                    {activeTab === 'category' && <th>Group</th>}
                    {activeTab === 'class'    && <th>Category</th>}
                    {activeTab === 'account'  && <th>Class</th>}
                    {(activeTab === 'category' || activeTab === 'class' || activeTab === 'account') && <th>Status</th>}
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(row => (
                    <tr
                      key={row.id}
                      className={selectedRow === row.id ? 'selected' : ''}
                      onClick={() => handleRowClick(row)}
                    >
                      <td><span className="td-id">#{row.id}</span></td>
                      {activeTab === 'account' && <td><code style={{ fontSize: '0.8rem', background: '#f1f5f9', padding: '2px 7px', borderRadius: 5, fontWeight: 700 }}>{row.code || '—'}</code></td>}
                      <td><span className="td-name">{row.name}</span></td>
                      {activeTab === 'category' && <td><span className="td-group">{getGroupName(row.groupId)}</span></td>}
                      {activeTab === 'class'    && <td><span className="td-group">{getCategoryName(row.categoryId)}</span></td>}
                      {activeTab === 'account'  && <td><span className="td-group">{getClassName(row.classId)}</span></td>}
                      {(activeTab === 'category' || activeTab === 'class' || activeTab === 'account') && (
                        <td>
                          {row.active
                            ? <span className="td-active-yes">● Active</span>
                            : <span className="td-active-no">○ Inactive</span>
                          }
                        </td>
                      )}
                      <td>
                        <div className="row-actions" onClick={e => e.stopPropagation()}>
                          <button className="btn-row-edit" onClick={() => handleRowClick(row)}>✏️ Edit</button>
                          <button className="btn-row-delete" onClick={() => handleDelete(row.id)}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <div className="table-footer">
              <span className="table-footer-text">
                {activeTab === 'group' ? `${groups.length} Groups` :
                 activeTab === 'category' ? `${categories.length} Categories across ${groups.length} Groups` :
                 activeTab === 'class' ? `${classes.length} Classes across ${categories.length} Categories` :
                 `${accounts.length} Accounts across ${classes.length} Classes`}
              </span>
              {selectedRow && (
                <span style={{ fontSize: '0.78rem', color: 'var(--teal)', fontWeight: 700 }}>
                  ✏️ Editing row #{selectedRow} — click Cancel to reset
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* TOAST */}
      {toast && (
        <div className="toast">
          <span>{toast.icon}</span>
          <span>{toast.msg}</span>
        </div>
      )}
    </>
  );
}