import React, { useState, useEffect } from 'react';
import './Navbar.css';
import { UserMenu, useAuth } from './Auth';

/**
 * FinTrack — top navigation bar (light theme).
 * Split out of HomePage so it can be reused across pages.
 *
 * Props:
 *   onNavigate(routeKey) — optional; called for items that map to a route.
 *   active               — optional; current route key, to highlight a link.
 *   onBack / canGoBack   — optional; renders a Back button on the LEFT.
 */
const NAV_LINKS = [
  { label: 'Dashboard',         route: 'dashboard' },
  { label: 'Chart of Accounts', route: 'account-group' },
  { label: 'Vouchers',          route: 'vouchers' },
  { label: 'General Ledger',    route: 'general-ledger' },
  { label: 'Reports',           route: 'reporting' },
];

export default function Navbar({ onNavigate, active, onBack, canGoBack }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const go = (route) => { if (onNavigate) onNavigate(route); setMenuOpen(false); };

  const handleClick = (item, e) => {
    if (item.route) { e.preventDefault(); go(item.route); }
    else setMenuOpen(false); // anchor link scrolls to #target
  };

  return (
    <nav className={`ftn${scrolled ? ' ftn--scrolled' : ''}`}>
      <div className="ftn-inner">
        {/* LEFT: optional Back button + Brand */}
        <div className="ftn-left">
          {onBack && canGoBack && (
            <button className="ftn-back" type="button" onClick={onBack} aria-label="Go back">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="15 18 9 12 15 6" />
                <line x1="19" y1="12" x2="9" y2="12" />
              </svg>
              <span>Back</span>
            </button>
          )}

          <a href="#overview" className="ftn-logo" onClick={(e) => { e.preventDefault(); go('home'); }}>
            <span className="ftn-logo-mark">F</span>
            <span className="ftn-logo-text">
              <span className="ftn-logo-name">FinTrack</span>
              <span className="ftn-logo-sub">Double-Entry Accounting</span>
            </span>
          </a>
        </div>

        {/* Links */}
        <div className={`ftn-links${menuOpen ? ' open' : ''}`}>
          {NAV_LINKS.map((item) => (
            <a
              key={item.label}
              href={item.route ? '#' : `#${item.target}`}
              className={`ftn-link${active && active === item.route ? ' active' : ''}`}
              onClick={(e) => handleClick(item, e)}
            >
              {item.label}
            </a>
          ))}
        </div>

        {/* Actions */}
        <div className="ftn-actions">
          {/* When signed in → user menu (avatar · role · logout · admin link).
              When not signed in → Sign in button (opens the auth page). */}
          {isAuthenticated ? (
            <UserMenu onManageUsers={() => go('users')} />
          ) : (
            <button className="ftn-btn-signup" onClick={() => go('login')}>
              <span>Sign in</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          )}

          <button
            className={`ftn-burger${menuOpen ? ' open' : ''}`}
            aria-label="Toggle menu"
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span></span><span></span><span></span>
          </button>
        </div>
      </div>
    </nav>
  );
}