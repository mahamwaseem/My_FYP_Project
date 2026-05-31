// ============================================================================
// FinTrack — AuthContext
// The single provider for auth state. Bootstraps the user from a stored token,
// exposes login / register / logout, and permission helpers (can / hasRole).
// Falls back to a DEMO user when no backend is reachable so the app is usable.
// ============================================================================
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI, tokenStore } from '../services/authApi';
import { can as canCheck, DEMO_CURRENT_USER } from '../services/authConstants';

const AuthContext = createContext(null);

// Demo fallback is now DISABLED — the backend is live. Set to true only if you
// want to explore the UI without a running backend (shows fake data).
const ALLOW_DEMO_FALLBACK = false;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);   // bootstrapping
  const [demo, setDemo] = useState(false);

  // bootstrap: if a token exists, load the profile
  useEffect(() => {
    let alive = true;
    (async () => {
      if (tokenStore.hasToken) {
        try {
          const profile = await authAPI.profile();
          if (alive) { setUser(normalize(profile)); setDemo(false); }
        } catch {
          tokenStore.clear();
          if (alive) setUser(null);
        }
      }
      if (alive) setLoading(false);
    })();
    return () => { alive = false; };
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      const data = await authAPI.login(email, password);
      const profile = data.user || await authAPI.profile();
      const u = normalize(profile);
      setUser(u); setDemo(false);
      return u;
    } catch (e) {
      // demo fallback only for the canned demo credentials
      if (ALLOW_DEMO_FALLBACK && isDemoLogin(email, password)) {
        const u = { ...DEMO_CURRENT_USER };
        setUser(u); setDemo(true);
        return u;
      }
      throw e;
    }
  }, []);

  const register = useCallback(async (payload) => {
    const data = await authAPI.register(payload);
    const profile = data.user || await authAPI.profile();
    const u = normalize(profile);
    setUser(u); setDemo(false);
    return u;
  }, []);

  const logout = useCallback(async () => {
    if (!demo) { try { await authAPI.logout(); } catch { /* noop */ } }
    tokenStore.clear();
    setUser(null); setDemo(false);
  }, [demo]);

  const value = {
    user,
    loading,
    demo,
    isAuthenticated: !!user,
    role: user?.role || null,
    login, register, logout,
    can: (perm) => canCheck(user?.role, perm),
    hasRole: (...roles) => !!user && roles.includes(user.role),
    refreshUser: async () => { try { setUser(normalize(await authAPI.profile())); } catch { /* noop */ } },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}

// ── helpers ──────────────────────────────────────────────────────────────────
function normalize(p = {}) {
  return {
    id: p.id,
    name: p.name || p.full_name || p.username || (p.email ? p.email.split('@')[0] : 'User'),
    email: p.email || '',
    role: p.role || 'viewer',
    status: p.status || 'active',
  };
}

// demo credentials (only used if backend is down)
function isDemoLogin(email, password) {
  return email === 'admin@mts.pk' && password === 'admin123';
}
