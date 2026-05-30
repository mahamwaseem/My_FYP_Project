import React from 'react';
import './Sidebar.css';

const NAV_ITEMS = [
  { id: 'dashboard',      icon: '⊞',  label: 'GL Dashboard',     section: 'main' },
  { id: 'ledger',         icon: '📒',  label: 'Account Ledger',   section: 'main' },
  { id: 'transactions',   icon: '🔎',  label: 'Transactions',     section: 'main' },
  { id: 'posting',        icon: '↳',   label: 'Posting Center',   section: 'processing' },
  { id: 'reconciliation', icon: '⚖',   label: 'Reconciliation',   section: 'processing' },
  { id: 'vouchers',       icon: '🗒',  label: 'Vouchers',         section: 'accounting' },
  { id: 'coa',            icon: '📋',  label: 'Chart of Accounts',section: 'accounting' },
];

const SECTIONS = { main: 'General Ledger', processing: 'Processing', accounting: 'Accounting' };

export default function Sidebar({ activePage, onNavigate, mobileOpen, onOverlayClick, pendingCount = 0 }) {
  const grouped = {};
  NAV_ITEMS.forEach((item) => {
    if (!grouped[item.section]) grouped[item.section] = [];
    grouped[item.section].push(item);
  });

  return (
    <>
      {mobileOpen && <div className="sidebar-overlay" onClick={onOverlayClick} />}
      <nav className={`sidebar${mobileOpen ? ' open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">F</div>
          <div className="sidebar-logo-text">
            <span className="sidebar-logo-name">FinTrack</span>
            <span className="sidebar-logo-tagline">General Ledger</span>
          </div>
        </div>

        {Object.entries(grouped).map(([section, items]) => (
          <div key={section} className="sidebar-section">
            <div className="sidebar-section-label">{SECTIONS[section]}</div>
            <div className="sidebar-nav">
              {items.map((item) => (
                <button
                  key={item.id}
                  className={`nav-item${activePage === item.id ? ' active' : ''}`}
                  onClick={() => onNavigate(item.id)}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span>{item.label}</span>
                  {item.id === 'posting' && pendingCount > 0 && (
                    <span className="nav-badge">{pendingCount}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">AB</div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">Account User</span>
              <span className="sidebar-user-role">Accountant</span>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
