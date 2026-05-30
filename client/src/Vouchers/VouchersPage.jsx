import React, { useState } from 'react';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './components/dashboard/Dashboard';
import VoucherList from './components/vouchers/VoucherList';
import Currencies from './components/currencies/Currencies';
import Recurring from './components/recurring/Recurring';
import './styles/global.css';

const SECTION_TITLES = {
  dashboard: 'Voucher Dashboard',
  vouchers:  'All Vouchers',
  currencies: 'Currencies',
  recurring: 'Recurring Schedule',
  reports:   'Reports',
  audit:     'Audit Log',
  coa:       'Chart of Accounts',
  settings:  'Settings',
};

export default function VouchersPage({ onBack, onAppNavigate }) {
  const [activePage, setActivePage] = useState('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNavigate = (page) => {
    if (page === 'coa') {
      if (onAppNavigate) onAppNavigate('account-group');
      return;
    }
    setActivePage(page);
    setMobileOpen(false);
  };

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return (
          <Dashboard
            onNavigate={setActivePage}
            onVoucherSelect={() => setActivePage('vouchers')}
          />
        );
      case 'vouchers':
        return <VoucherList />;
      case 'currencies':
        return <Currencies />;
      case 'recurring':
        return <Recurring />;
      case 'reports':
      case 'audit':
      case 'settings':
        return (
          <div className="card" style={{ padding: '24px' }}>
            <h2>{SECTION_TITLES[activePage]}</h2>
            <p style={{ marginTop: '12px', color: 'var(--text-secondary)' }}>
              This section is part of the voucher module navigation. It will display the full {SECTION_TITLES[activePage].toLowerCase()} view when implemented.
            </p>
          </div>
        );
      default:
        return <VoucherList />;
    }
  };

  return (
    <div className="app-shell">
      <Sidebar
        activePage={activePage}
        onNavigate={handleNavigate}
        mobileOpen={mobileOpen}
        onOverlayClick={() => setMobileOpen(false)}
      />

      <div className="main-content">
        <Header
          title={SECTION_TITLES[activePage] || 'Vouchers'}
          subtitle="Manage all your voucher entries and ledger data"
          onMenuClick={() => setMobileOpen((open) => !open)}
        >
          <button className="btn btn-secondary btn-sm" onClick={onBack}>
            Back Home
          </button>
        </Header>

        <main className="page-body">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}