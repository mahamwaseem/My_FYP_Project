import React, { useState } from 'react';
import './styles/global.css';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import ToastContainer from './components/shared/Toast';
import Dashboard from './components/dashboard/Dashboard';
import VoucherList from './components/vouchers/VoucherList';
import Currencies from './components/currencies/Currencies';

const PAGE_CONFIG = {
  dashboard:  { title: 'Dashboard',         subtitle: 'Overview of your accounting activity' },
  vouchers:   { title: 'Vouchers',           subtitle: 'Manage payment, receipt & journal vouchers' },
  currencies: { title: 'Currencies',         subtitle: 'Manage supported currencies & exchange rates' },
  recurring:  { title: 'Recurring Schedules', subtitle: 'Automated recurring transactions' },
  reports:    { title: 'Reports',            subtitle: 'Financial reports & ledger statements' },
  audit:      { title: 'Audit Log',          subtitle: 'System-wide audit trail' },
  coa:        { title: 'Chart of Accounts',  subtitle: 'Account structure management' },
  settings:   { title: 'Settings',           subtitle: 'System configuration' },
};

function PlaceholderPage({ page }) {
  const config = PAGE_CONFIG[page] || {};
  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <div style={{ fontSize: '3rem', marginBottom: '16px', opacity: 0.4 }}>🚧</div>
      <h2 style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>{config.title}</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
        This module is under development. Connect to the backend API when ready.
      </p>
    </div>
  );
}

export default function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [mobileOpen, setMobileOpen]  = useState(false);

  const config = PAGE_CONFIG[activePage] || {};

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':  return <Dashboard onNavigate={setActivePage} onVoucherSelect={() => setActivePage('vouchers')} />;
      case 'vouchers':   return <VoucherList />;
      case 'currencies': return <Currencies />;
      default:           return <PlaceholderPage page={activePage} />;
    }
  };

  return (
    <div className="app-shell">
      <Sidebar
        activePage={activePage}
        onNavigate={(page) => { setActivePage(page); setMobileOpen(false); }}
        mobileOpen={mobileOpen}
        onOverlayClick={() => setMobileOpen(false)}
      />
      <div className="main-content">
        <Header
          title={config.title}
          subtitle={config.subtitle}
          onMenuClick={() => setMobileOpen((v) => !v)}
        />
        <div className="page-body">
          {renderPage()}
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}
