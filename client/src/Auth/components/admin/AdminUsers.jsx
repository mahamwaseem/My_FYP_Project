import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useUsers, useToast } from '../../hooks/useAuthHooks';
import { ROLE_LIST, ROLES } from '../../services/authConstants';
import Icon from '../shared/Icon';
import { ToastContainer } from '../shared/Toast';

const ROLE_CLS = { admin: 'r-admin', accountant: 'r-acct', viewer: 'r-view' };
const roleLabel = (k) => (ROLES[k] ? ROLES[k].label : k);

export default function AdminUsers({ onBack }) {
  const { user: me } = useAuth();
  const { users, loading, demo, setRole, setStatus, createUser, setPassword } = useUsers();
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [roleModal, setRoleModal] = useState(null);    // user being role-edited
  const [addOpen, setAddOpen] = useState(false);
  const [pwModal, setPwModal] = useState(null);

  const counts = useMemo(() => {
    const c = { admin: 0, accountant: 0, viewer: 0 };
    users.forEach((u) => { if (c[u.role] != null) c[u.role] += 1; });
    return c;
  }, [users]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (!q) return true;
      return (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q);
    });
  }, [users, query, roleFilter]);

  const initials = (name = '') => name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() || 'U';

  const applyRole = async (id, role) => {
    await setRole(id, role);
    setRoleModal(null);
    toast.success(`Role updated to ${roleLabel(role)}.`);
  };

  const toggleStatus = async (u) => {
    const next = u.status === 'active' ? 'disabled' : 'active';
    if (u.id === me?.id && next === 'disabled') { toast.error("You can't disable your own account."); return; }
    await setStatus(u.id, next);
    toast.success(next === 'active' ? 'Account enabled.' : 'Account disabled.');
  };

  return (
    <div className="au au-shell">
      <ToastContainer />
      {/* top bar with the logged-in admin */}
      <div className="au-topbar">
        <span className="au-tb-left">
          {onBack && <button className="au-tb-back" onClick={onBack}><Icon name="back" size={14} /></button>}
          <span className="au-tb-logo">F</span> FinTrack
          <span className="au-tb-div">|</span>
          <span className="au-tb-sub">Administration · User Management</span>
        </span>
        <span className="au-tb-right">
          <span className="au-tb-user"><span className="au-tb-av">{initials(me?.name)}</span> {me?.name} · <b>{roleLabel(me?.role)}</b></span>
        </span>
      </div>

      <div className="au-admin">
        {demo && <div className="au-demo-flag">Showing demo users — connect <code>/api/auth/users/</code> for live data.</div>}

        {/* role summary strip */}
        <div className="au-summary">
          {ROLE_LIST.map((r) => (
            <div className="au-sum" key={r.key}>
              <span className="au-sum-ic"><Icon name={r.icon} size={18} /></span>
              <div className="au-sum-body">
                <span className="au-sum-count">{counts[r.key]}</span>
                <span className="au-sum-name">{r.label}</span>
              </div>
              <span className="au-sum-code">{r.code}</span>
            </div>
          ))}
          <div className="au-sum au-sum-total">
            <span className="au-sum-ic"><Icon name="users" size={18} /></span>
            <div className="au-sum-body"><span className="au-sum-count">{users.length}</span><span className="au-sum-name">Total users</span></div>
          </div>
        </div>

        {/* toolbar */}
        <div className="au-toolbar">
          <div className="au-search">
            <Icon name="search" size={15} />
            <input placeholder="Search users by name or email…" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <div className="au-tools-right">
            <div className="au-filter">
              <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                <option value="all">All roles</option>
                {ROLE_LIST.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
              </select>
              <Icon name="chevron" size={13} />
            </div>
            <button className="au-btn-primary" onClick={() => setAddOpen(true)}><Icon name="users" size={15} /> Add User</button>
          </div>
        </div>

        {/* users table */}
        <div className="au-table-card">
          <table className="au-table">
            <thead>
              <tr><th>User ID</th><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Last login</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i}><td colSpan={7}><span className="au-skel" style={{ animationDelay: `${i * 80}ms` }} /></td></tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="au-empty">No users match your search.</td></tr>
              ) : (
                filtered.map((u, i) => (
                  <tr key={u.id} style={{ animationDelay: `${i * 45}ms` }}>
                    <td className="au-mono">{u.user_id || `USR-${String(u.id).padStart(3, '0')}`}</td>
                    <td>
                      <span className="au-u">
                        <span className="au-avatar">{initials(u.name)}</span>
                        {u.name}{u.id === me?.id && <span className="au-you">you</span>}
                      </span>
                    </td>
                    <td className="au-mono au-dim">{u.email}</td>
                    <td><span className={`au-rtag ${ROLE_CLS[u.role] || ''}`}>{roleLabel(u.role)}</span></td>
                    <td><span className={`au-status ${u.status === 'active' ? 'on' : 'off'}`}><Icon name="dot" size={9} /> {u.status === 'active' ? 'Active' : 'Disabled'}</span></td>
                    <td className="au-mono au-dim">{u.last_login || '—'}</td>
                    <td>
                      <div className="au-actions">
                        <button title="Change role" onClick={() => setRoleModal(u)}><Icon name="key" size={14} /></button>
                        <button title="Reset password" onClick={() => setPwModal(u)}><Icon name="lock" size={14} /></button>
                        <button title={u.status === 'active' ? 'Disable' : 'Enable'} onClick={() => toggleStatus(u)} className={u.status === 'active' ? '' : 'off'}><Icon name="power" size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <div className="au-table-foot">
            <span>{filtered.length} {filtered.length === 1 ? 'user' : 'users'}</span>
            <span>{roleFilter === 'all' ? 'Showing all roles' : `Filtered: ${roleLabel(roleFilter)}`}</span>
          </div>
        </div>
      </div>

      {/* change-role modal */}
      {roleModal && (
        <ChangeRoleModal user={roleModal} onClose={() => setRoleModal(null)} onApply={applyRole} initials={initials} />
      )}

      {pwModal && (
        <ResetPasswordModal
          user={pwModal}
          initials={initials}
          onClose={() => setPwModal(null)}
          onApply={async (newPw) => {
            try {
              await setPassword(pwModal.id, newPw);
              toast.success(`Temporary password set for ${pwModal.name}. Share it securely.`);
              setPwModal(null);
            } catch (e) {
              toast.error((e && e.message) || 'Could not reset the password.');
            }
          }}
        />
      )}

      {/* add-user modal */}
      {addOpen && (
        <AddUserModal onClose={() => setAddOpen(false)} onCreate={async (payload) => {
          try { await createUser(payload); setAddOpen(false); toast.success(`User ${payload.name} created as ${roleLabel(payload.role)}.`); }
          catch (e) { toast.error(e.message || 'Could not create user.'); }
        }} />
      )}
    </div>
  );
}

// ── Change Role modal ─────────────────────────────────────────────────────────
function ChangeRoleModal({ user, onClose, onApply, initials }) {
  const [role, setRole] = useState(user.role);
  return (
    <div className="au-modal-overlay" onMouseDown={onClose}>
      <div className="au-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="au-modal-head">
          <h3 className="au-modal-title">Change Role</h3>
          <button className="au-modal-x" onClick={onClose}><Icon name="close" size={16} /></button>
        </div>
        <div className="au-modal-user">
          <span className="au-avatar lg">{initials(user.name)}</span>
          <div><div className="au-modal-uname">{user.name}</div><div className="au-modal-uemail">{user.email}</div></div>
        </div>
        <div className="au-role-options">
          {ROLE_LIST.map((r) => (
            <button key={r.key} className={`au-role-opt${role === r.key ? ' on' : ''}`} onClick={() => setRole(r.key)}>
              <span className="au-role-opt-ic"><Icon name={r.icon} size={18} /></span>
              <span className="au-role-opt-text">
                <span className="au-role-opt-name">{r.label}</span>
                <span className="au-role-opt-sub">{r.desc}</span>
              </span>
              <span className="au-role-opt-radio">{role === r.key && <Icon name="check" size={14} stroke={2.5} />}</span>
            </button>
          ))}
        </div>
        <div className="au-modal-foot">
          <button className="au-btn-ghost" onClick={onClose}>Cancel</button>
          <button className="au-btn-primary" onClick={() => onApply(user.id, role)} disabled={role === user.role}>Save changes</button>
        </div>
      </div>
    </div>
  );
}

// ── Add User modal ──────────────────────────────────────────────────────────
function AddUserModal({ onClose, onCreate }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'viewer' });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    if (!form.name || !form.email || !form.password) return;
    setBusy(true);
    await onCreate(form);
    setBusy(false);
  };

  return (
    <div className="au-modal-overlay" onMouseDown={onClose}>
      <div className="au-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="au-modal-head">
          <h3 className="au-modal-title">Add User</h3>
          <button className="au-modal-x" onClick={onClose}><Icon name="close" size={16} /></button>
        </div>
        <div className="au-modal-body">
          <label className="au-field">
            <span className="au-label">Full Name <em>*</em></span>
            <span className="au-input"><Icon name="user" /><input type="text" placeholder="Full name" value={form.name} onChange={set('name')} /></span>
          </label>
          <label className="au-field">
            <span className="au-label">Email <em>*</em></span>
            <span className="au-input"><Icon name="mail" /><input type="email" placeholder="user@mts.pk" value={form.email} onChange={set('email')} /></span>
          </label>
          <label className="au-field">
            <span className="au-label">Temporary Password <em>*</em></span>
            <span className="au-input"><Icon name="lock" /><input type="text" placeholder="Set an initial password" value={form.password} onChange={set('password')} /></span>
          </label>
          <label className="au-field">
            <span className="au-label">Assign Role</span>
            <div className="au-filter full">
              <select value={form.role} onChange={set('role')}>
                {ROLE_LIST.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
              </select>
              <Icon name="chevron" size={13} />
            </div>
          </label>
        </div>
        <div className="au-modal-foot">
          <button className="au-btn-ghost" onClick={onClose}>Cancel</button>
          <button className="au-btn-primary" onClick={submit} disabled={busy || !form.name || !form.email || !form.password}>
            {busy ? 'Creating…' : 'Create user'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Reset Password modal (admin sets a temporary password) ──────────────────
function ResetPasswordModal({ user, onClose, onApply, initials }) {
  const [pw, setPw] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  const gen = () => {
    // simple readable temp password: 3 letters + 4 digits + symbol
    const a = 'abcdefghjkmnpqrstuvwxyz';
    const A = 'ABCDEFGHJKMNPQRSTUVWXYZ';
    const d = '23456789';
    const pick = (s, n) => Array.from({ length: n }, () => s[Math.floor(Math.random() * s.length)]).join('');
    setPw(`${pick(A, 1)}${pick(a, 3)}${pick(d, 4)}#`);
    setShow(true);
  };

  const submit = async () => {
    if (pw.length < 6) return;
    setBusy(true);
    await onApply(pw);
    setBusy(false);
  };

  return (
    <div className="au-modal-overlay" onMouseDown={onClose}>
      <div className="au-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="au-modal-head">
          <h3 className="au-modal-title">Reset Password</h3>
          <button className="au-modal-x" onClick={onClose}><Icon name="close" size={16} /></button>
        </div>

        <div className="au-modal-user">
          <span className="au-avatar">{initials(user.name)}</span>
          <span>
            <span className="au-modal-user-name">{user.name}</span>
            <span className="au-modal-user-email">{user.email}</span>
          </span>
        </div>

        <div className="au-field">
          <label className="au-label">TEMPORARY PASSWORD</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <div className="au-input-wrap" style={{ flex: 1 }}>
              <span className="au-input-ic"><Icon name="lock" size={16} /></span>
              <input
                className="au-input"
                type={show ? 'text' : 'password'}
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                placeholder="Enter a temporary password"
                autoFocus
              />
              <button type="button" className="au-input-eye" onClick={() => setShow((s) => !s)} title={show ? 'Hide' : 'Show'}>
                <Icon name={show ? 'eye-off' : 'eye'} size={16} />
              </button>
            </div>
            <button type="button" className="au-btn-ghost" onClick={gen} style={{ whiteSpace: 'nowrap' }}>Generate</button>
          </div>
          <p className="au-hint" style={{ marginTop: 8 }}>
            Share this password with {user.name.split(' ')[0]} securely. They should change it after signing in.
          </p>
        </div>

        <div className="au-modal-foot">
          <button className="au-btn-ghost" onClick={onClose}>Cancel</button>
          <button className="au-btn-primary" onClick={submit} disabled={pw.length < 6 || busy}>
            {busy ? 'Saving…' : 'Set password'}
          </button>
        </div>
      </div>
    </div>
  );
}
