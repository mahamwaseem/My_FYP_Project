import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../services/authConstants';
import { changeMyPassword } from '../../services/authApi';
import { emitToast } from '../../hooks/useAuthHooks';
import Icon from '../shared/Icon';

const ROLE_CLS = { admin: 'r-admin', accountant: 'r-acct', viewer: 'r-view' };

// Drop this into the app navbar. Shows the current user, their role, a link to
// User Management (admins only), Change Password, and logout.
export default function UserMenu({ onManageUsers }) {
  const { user, role, logout, hasRole } = useAuth();
  const [open, setOpen] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  if (!user) return null;
  const initials = (user.name || '').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() || 'U';
  const roleLabel = ROLES[role] ? ROLES[role].label : role;

  return (
    <div className="au-usermenu" ref={ref}>
      <button className="au-um-trigger" onClick={() => setOpen((o) => !o)}>
        <span className="au-um-avatar">{initials}</span>
        <span className="au-um-meta">
          <span className="au-um-name">{user.name}</span>
          <span className={`au-um-role ${ROLE_CLS[role] || ''}`}>{roleLabel}</span>
        </span>
        <Icon name="chevron" size={14} />
      </button>

      {open && (
        <div className="au-um-pop">
          <div className="au-um-pop-head">
            <span className="au-avatar lg">{initials}</span>
            <div><div className="au-um-pop-name">{user.name}</div><div className="au-um-pop-email">{user.email}</div></div>
          </div>
          <div className="au-um-pop-role">
            <span className="au-um-pop-label">Role</span>
            <span className={`au-rtag ${ROLE_CLS[role] || ''}`}>{roleLabel}</span>
          </div>
          <div className="au-um-divider" />
          {hasRole('admin') && onManageUsers && (
            <button className="au-um-item" onClick={() => { setOpen(false); onManageUsers(); }}>
              <Icon name="users" size={15} /> User Management
            </button>
          )}
          <button className="au-um-item" onClick={() => { setOpen(false); setPwOpen(true); }}>
            <Icon name="lock" size={15} /> Change Password
          </button>
          <button className="au-um-item danger" onClick={() => { setOpen(false); logout(); }}>
            <Icon name="logout" size={15} /> Sign out
          </button>
        </div>
      )}

      {pwOpen && <ChangePasswordModal onClose={() => setPwOpen(false)} />}
    </div>
  );
}

// ── Change my own password ───────────────────────────────────────────────────
function ChangePasswordModal({ onClose }) {
  const [form, setForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    if (!form.current_password || form.new_password.length < 6) return;
    if (form.new_password !== form.confirm_password) {
      emitToast({ type: 'error', title: 'Error', message: 'New passwords do not match.' });
      return;
    }
    setBusy(true);
    try {
      await changeMyPassword(form);
      emitToast({ type: 'success', title: 'Password changed', message: 'Your password has been updated.' });
      onClose();
    } catch (e) {
      emitToast({ type: 'error', title: 'Error', message: (e && e.message) || 'Could not change password.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="au-modal-overlay" onMouseDown={onClose}>
      <div className="au-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="au-modal-head">
          <h3 className="au-modal-title">Change Password</h3>
          <button className="au-modal-x" onClick={onClose}><Icon name="close" size={16} /></button>
        </div>

        <div className="au-field">
          <label className="au-label">CURRENT PASSWORD</label>
          <div className="au-input-wrap">
            <span className="au-input-ic"><Icon name="lock" size={16} /></span>
            <input className="au-input" type={show ? 'text' : 'password'} value={form.current_password}
                   onChange={set('current_password')} placeholder="Your current password" autoFocus />
          </div>
        </div>

        <div className="au-field">
          <label className="au-label">NEW PASSWORD</label>
          <div className="au-input-wrap">
            <span className="au-input-ic"><Icon name="lock" size={16} /></span>
            <input className="au-input" type={show ? 'text' : 'password'} value={form.new_password}
                   onChange={set('new_password')} placeholder="At least 6 characters" />
            <button type="button" className="au-input-eye" onClick={() => setShow((s) => !s)} title={show ? 'Hide' : 'Show'}>
              <Icon name={show ? 'eye-off' : 'eye'} size={16} />
            </button>
          </div>
        </div>

        <div className="au-field">
          <label className="au-label">CONFIRM NEW PASSWORD</label>
          <div className="au-input-wrap">
            <span className="au-input-ic"><Icon name="lock" size={16} /></span>
            <input className="au-input" type={show ? 'text' : 'password'} value={form.confirm_password}
                   onChange={set('confirm_password')} placeholder="Re-enter the new password" />
          </div>
        </div>

        <div className="au-modal-foot">
          <button className="au-btn-ghost" onClick={onClose}>Cancel</button>
          <button className="au-btn-primary" onClick={submit}
                  disabled={busy || !form.current_password || form.new_password.length < 6}>
            {busy ? 'Saving…' : 'Change password'}
          </button>
        </div>
      </div>
    </div>
  );
}
