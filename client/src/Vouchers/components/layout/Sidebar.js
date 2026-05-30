import React from 'react';
import './Sidebar.css';

const NAV_ITEMS = [
  { id: 'dashboard',  icon: '⊞',  label: 'Dashboard',        section: 'main' },
  { id: 'vouchers',   icon: '🗒',  label: 'Vouchers',          section: 'main', badge: null },
  { id: 'currencies', icon: '💱',  label: 'Currencies',        section: 'main' },
  { id: 'recurring',  icon: '↻',   label: 'Recurring',         section: 'main' },
  { id: 'reports',    icon: '📊',  label: 'Reports',           section: 'reports' },
  { id: 'audit',      icon: '🔍',  label: 'Audit Log',         section: 'reports' },
  { id: 'coa',        icon: '📋',  label: 'Chart of Accounts', section: 'accounting' },
  { id: 'settings',   icon: '⚙',   label: 'Settings',          section: 'system' },
];

const SECTIONS = {
  main:        'Main',
  reports:     'Reports',
  accounting:  'Accounting',
  system:      'System',
};

export default function Sidebar({ activePage, onNavigate, mobileOpen, onOverlayClick }) {
  const grouped = {};
  NAV_ITEMS.forEach((item) => {
    if (!grouped[item.section]) grouped[item.section] = [];
    grouped[item.section].push(item);
  });

  return (
    <>
      {mobileOpen && <div className="sidebar-overlay" onClick={onOverlayClick} />}
      <nav className={`sidebar${mobileOpen ? ' open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">F</div>
          <div className="sidebar-logo-text">
            <span className="sidebar-logo-name">FinTrack</span>
            <span className="sidebar-logo-tagline">Professional Accounting</span>
          </div>
        </div>

        {/* Navigation */}
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
                  {item.badge !== null && item.badge !== undefined && (
                    <span className="nav-badge">{item.badge}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* User footer */}
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
