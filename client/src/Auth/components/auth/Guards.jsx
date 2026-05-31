import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { can as canCheck } from '../../services/authConstants';
import Icon from '../shared/Icon';
import AuthPage from './AuthPage';
import { ToastContainer } from '../shared/Toast';

// ── RequireAuth — gates a MODULE on being logged in ──────────────────────────
// Unlike AuthGate (which wraps the whole app), this shows the login screen
// inline only when an unauthenticated user opens a protected module. Once they
// sign in, `children` render. Optionally also require a permission.
export function RequireAuth({ children, perm = null, onBack }) {
  const { isAuthenticated, loading, role } = useAuth();
  if (loading) return <BootSplash />;
  if (!isAuthenticated) return <><ToastContainer /><AuthPage /></>;
  if (perm && !canCheck(role, perm)) return <AccessDenied onBack={onBack} />;
  return children;
}

// ── AccessDenied screen ──────────────────────────────────────────────────────
export function AccessDenied({ onBack }) {
  const { role } = useAuth();
  return (
    <div className="au-denied">
      <div className="au-denied-card">
        <span className="au-denied-ic"><Icon name="ban" size={34} /></span>
        <h2 className="au-denied-title">Access Restricted</h2>
        <p className="au-denied-desc">
          You don't have permission to view this module. Your role
          {role ? <> (<b>{role}</b>)</> : null} doesn't include access here.
          Contact your administrator if you believe this is a mistake.
        </p>
        {onBack && <button className="au-denied-btn" onClick={onBack}><Icon name="back" size={15} /> Go back</button>}
      </div>
    </div>
  );
}

// ── PrivateRoute — gates on being authenticated ──────────────────────────────
// `fallback` is shown when not logged in (typically the AuthPage / login).
export function PrivateRoute({ children, fallback = null }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <BootSplash />;
  if (!isAuthenticated) return fallback;
  return children;
}

// ── RequirePermission — gates a route/section on a permission ────────────────
export function RequirePermission({ perm, children, onBack }) {
  const { role, loading } = useAuth();
  if (loading) return <BootSplash />;
  if (!canCheck(role, perm)) return <AccessDenied onBack={onBack} />;
  return children;
}

// ── RoleGate — render children only for given roles (no denied screen) ───────
export function RoleGate({ roles = [], children, fallback = null }) {
  const { role } = useAuth();
  return roles.includes(role) ? children : fallback;
}

// ── Can — inline permission gate for buttons/sections ────────────────────────
// usage: <Can perm={PERMISSIONS.MANAGE_VOUCHERS}>{(allowed) => ...}</Can>
export function Can({ perm, children, fallback = null }) {
  const { role } = useAuth();
  const allowed = canCheck(role, perm);
  if (typeof children === 'function') return children(allowed);
  return allowed ? children : fallback;
}

function BootSplash() {
  return (
    <div className="au-boot">
      <div className="au-boot-mark">F</div>
      <div className="au-boot-bar"><span /></div>
      <p className="au-boot-text">Securing session…</p>
    </div>
  );
}

export default PrivateRoute;
