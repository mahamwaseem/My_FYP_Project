import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useAuthHooks';
import { ROLE_LIST } from '../../services/authConstants';
import Icon from '../shared/Icon';

// Enterprise sign-in console — the approved SAP-style gate. Handles both
// Sign in and Register, wired to AuthContext.
export default function AuthPage() {
  const { login, register } = useAuth();
  const toast = useToast();
  const [mode, setMode] = useState('login');     // login | register
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm_password: '', remember: true });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      if (mode === 'login') {
        if (!form.email || !form.password) throw new Error('Enter your email and password.');
        const u = await login(form.email.trim(), form.password);
        toast.success(`Signed in as ${u.name}.`, 'Welcome');
      } else {
        if (!form.name || !form.email || !form.password) throw new Error('Please complete all required fields.');
        if (form.password.length < 6) throw new Error('Password must be at least 6 characters.');
        if (form.password !== form.confirm_password) throw new Error('Passwords do not match.');
        const u = await register({
          name: form.name.trim(), email: form.email.trim(),
          password: form.password, confirm_password: form.confirm_password,
        });
        toast.success(`Account created — signed in as ${u.name}.`, 'Registered');
      }
    } catch (err) {
      toast.error(err.message || 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="au au-shell">
      {/* enterprise top status bar */}
      <div className="au-topbar">
        <span className="au-tb-left">
          <span className="au-tb-logo">F</span> FinTrack
          <span className="au-tb-div">|</span>
          <span className="au-tb-sub">Double-Entry Accounting System</span>
        </span>
        <span className="au-tb-right">
          <span className="au-tb-pill">SECURE SESSION</span>
          <span className="au-tb-env">v1.0</span>
        </span>
      </div>

      <div className="au-gate">
        {/* LEFT — identity + authorization tiers */}
        <aside className="au-panel">
          <div className="au-panel-grid" aria-hidden="true" />
          <div className="au-panel-inner">
            <div className="au-sysid">
              <span className="au-sysid-ic"><Icon name="shield" size={26} /></span>
              <div>
                <div className="au-sysid-title">Access Control</div>
                <div className="au-sysid-sub">Authenticated &amp; role-secured</div>
              </div>
            </div>

            <p className="au-panel-desc">
              FinTrack enforces role-based authorization across every accounting module.
              Sign in with your assigned credentials to continue.
            </p>

            <div className="au-legend">
              <div className="au-legend-head">Authorization tiers</div>
              {ROLE_LIST.map((r) => (
                <div className="au-tier" key={r.key}>
                  <span className="au-tier-code">{r.code}</span>
                  <span className="au-tier-ic"><Icon name={r.icon} size={16} /></span>
                  <span className="au-tier-text">
                    <span className="au-tier-name">{r.label}</span>
                    <span className="au-tier-sub">{r.desc}</span>
                  </span>
                </div>
              ))}
            </div>

            <div className="au-panel-foot">
              <Icon name="lock" size={13} /> 256-bit encrypted credentials · session secured
            </div>
          </div>
        </aside>

        {/* RIGHT — form */}
        <main className="au-form-col">
          <form className="au-card" onSubmit={submit}>
            <div className="au-card-head">
              <h2 className="au-card-title">{mode === 'login' ? 'Sign in to FinTrack' : 'Register new account'}</h2>
              <p className="au-card-sub">
                {mode === 'login'
                  ? 'Enter your credentials to access the system.'
                  : 'New accounts are granted Viewer access until an administrator assigns a role.'}
              </p>
            </div>

            <div className="au-tabs">
              <button type="button" className={mode === 'login' ? 'on' : ''} onClick={() => setMode('login')}>Sign in</button>
              <button type="button" className={mode === 'register' ? 'on' : ''} onClick={() => setMode('register')}>Register</button>
            </div>

            <div className="au-form">
              {mode === 'register' && (
                <label className="au-field">
                  <span className="au-label">Full Name <em>*</em></span>
                  <span className="au-input"><Icon name="user" /><input type="text" placeholder="Ayesha Khan" value={form.name} onChange={set('name')} /></span>
                </label>
              )}

              <label className="au-field">
                <span className="au-label">Email Address <em>*</em></span>
                <span className="au-input"><Icon name="mail" /><input type="email" placeholder="you@mts.pk" value={form.email} onChange={set('email')} autoComplete="email" /></span>
              </label>

              <label className="au-field">
                <span className="au-label">Password <em>*</em></span>
                <span className="au-input">
                  <Icon name="lock" />
                  <input type={showPw ? 'text' : 'password'} placeholder="Enter password" value={form.password} onChange={set('password')} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
                  <button type="button" className="au-eye" onClick={() => setShowPw(!showPw)} tabIndex={-1}><Icon name={showPw ? 'eyeOff' : 'eye'} size={15} /></button>
                </span>
              </label>

              {mode === 'register' && (
                <label className="au-field">
                  <span className="au-label">Confirm Password <em>*</em></span>
                  <span className="au-input"><Icon name="lock" /><input type="password" placeholder="Re-enter password" value={form.confirm_password} onChange={set('confirm_password')} /></span>
                </label>
              )}

              {mode === 'login' && (
                <div className="au-row-between">
                  <label className="au-check"><input type="checkbox" checked={form.remember} onChange={set('remember')} /> Keep me signed in</label>
                  <button type="button" className="au-link" onClick={() => toast.info('Contact your administrator to reset your password.')}>Forgot password?</button>
                </div>
              )}

              <button className="au-submit" type="submit" disabled={busy}>
                {busy ? 'Please wait…' : (mode === 'login' ? 'Sign in' : 'Create account')} <Icon name="arrow" size={16} />
              </button>

              <div className="au-card-switch">
                {mode === 'login' ? 'No account? ' : 'Already have an account? '}
                <button type="button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
                  {mode === 'login' ? 'Register here' : 'Sign in'}
                </button>
              </div>
            </div>
          </form>
          <div className="au-form-foot">© 2025 FinTrack — Multi Tech Solutions · Authorized access only</div>
        </main>
      </div>
    </div>
  );
}
