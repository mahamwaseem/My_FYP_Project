import React from 'react';
import './styles/auth.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastContainer } from './components/shared/Toast';
import AuthPage from './components/auth/AuthPage';

// ── AuthGate ──────────────────────────────────────────────────────────────────
// Wrap your whole app in <AuthGate>…</AuthGate>. Until the user signs in, the
// enterprise AuthPage is shown. Once authenticated, your app renders.
function Gate({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="au au-boot">
        <div className="au-boot-mark">F</div>
        <div className="au-boot-bar"><span /></div>
        <p className="au-boot-text">Securing session…</p>
      </div>
    );
  }
  if (!isAuthenticated) return <><ToastContainer /><AuthPage /></>;
  return <><ToastContainer />{children}</>;
}

// The provider + gate together. Use this at the root of the app.
export default function AuthGate({ children }) {
  return (
    <AuthProvider>
      <Gate>{children}</Gate>
    </AuthProvider>
  );
}
