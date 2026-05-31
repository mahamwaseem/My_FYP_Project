import React, { useState } from 'react';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './components/dashboard/Dashboard';
import VoucherList from './components/vouchers/VoucherList';
import Currencies from './components/currencies/Currencies';
import Recurring from './components/recurring/Recurring';
import './components/layout/PageHead.css';
import './styles/global.css';

const SECTION_TITLES = {
  dashboard:  'Voucher Dashboard',
  vouchers:   'All Vouchers',
  currencies: 'Currencies',
  recurring:  'Recurring Schedule',
  coa:        'Chart of Accounts',
};

const SECTION_SUBTITLES = {
  dashboard:  'Overview of your voucher activity and ledger health',
  vouchers:   'Record, post, and manage double-entry transactions',
  currencies: 'Manage currencies and exchange rates',
  recurring:  'Automate repeating entries like salaries and rent',
};

export default function VouchersPage({ onBack, onAppNavigate }) {
  const [activePage, setActivePage] = useState('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNavigate = (page) => {
    // Cross-module links leave the Vouchers shell and open the real modules.
    if (page === 'coa') {
      if (onAppNavigate) onAppNavigate('account-group');
      return;
    }
    if (page === 'reports' || page === 'audit') {
      // Both open the Reporting module (operational reports + Audit Trail).
      if (onAppNavigate) onAppNavigate('reporting');
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
        <main className="page-body">
          {/* Bold module heading (replaces the old internal header bar) */}
          <div className="vp-pagehead">
            <button
              className="vp-menu-btn"
              onClick={() => setMobileOpen((open) => !open)}
              aria-label="Toggle menu"
            >
              <span></span><span></span><span></span>
            </button>
            <div className="vp-pagehead-text">
              <h1 className="vp-title">{SECTION_TITLES[activePage] || 'Vouchers'}</h1>
              <p className="vp-subtitle">
                {SECTION_SUBTITLES[activePage] || 'Manage all your voucher entries and ledger data'}
              </p>
            </div>
          </div>

          {renderPage()}
        </main>
      </div>
    </div>
  );
}