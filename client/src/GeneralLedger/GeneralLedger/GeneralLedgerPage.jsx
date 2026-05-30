import React, { useState } from 'react';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import ToastContainer from './components/shared/Toast';
import LedgerDashboard from './components/gl/LedgerDashboard';
import AccountLedger from './components/gl/AccountLedger';
import TransactionSearch from './components/gl/TransactionSearch';
import PostingCenter from './components/gl/PostingCenter';
import Reconciliation from './components/gl/Reconciliation';
import { usePostingQueue } from './hooks/useGeneralLedger';
import './styles/global.css';

const SECTION_META = {
  dashboard:      { title: 'General Ledger Dashboard', subtitle: 'A live overview of balances, postings and reconciliation status' },
  ledger:         { title: 'Account Ledger',           subtitle: 'Detailed debits, credits and running balances for a single account' },
  transactions:   { title: 'Transaction Search',       subtitle: 'Search and filter every historical ledger entry' },
  posting:        { title: 'Posting Center',           subtitle: 'Post pending vouchers to their ledgers, manually or automatically' },
  reconciliation: { title: 'Bank Reconciliation',      subtitle: 'Match ledger entries against your bank statement' },
};

export default function GeneralLedgerPage({ onBack, onAppNavigate }) {
  const [activePage, setActivePage] = useState('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [ledgerAccountId, setLedgerAccountId] = useState(null);
  // Readable default base size (16px). The Header control rewrites this at runtime;
  // because all module type is in em, one variable rescales the whole module.
  const [fontSize, setFontSize] = useState(16);

  // Page-level queue read drives the sidebar "pending" badge.
  const { queue } = usePostingQueue();
  const pendingCount = Array.isArray(queue) ? queue.length : 0;

  const handleNavigate = (page, accountId) => {
    // Cross-module links hand off to the host app (falls back to a stub panel).
    if (page === 'vouchers' || page === 'coa') {
      if (onAppNavigate) {
        onAppNavigate(page === 'coa' ? 'account-group' : 'vouchers');
        return;
      }
    }
    if (page === 'ledger' && accountId != null) setLedgerAccountId(accountId);
    setActivePage(page);
    setMobileOpen(false);
  };

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <LedgerDashboard onNavigate={handleNavigate} />;
      case 'ledger':
        return <AccountLedger initialAccountId={ledgerAccountId} />;
      case 'transactions':
        return <TransactionSearch />;
      case 'posting':
        return <PostingCenter />;
      case 'reconciliation':
        return <Reconciliation />;
      case 'vouchers':
      case 'coa':
        return (
          <div className="card" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '1.3em', fontWeight: 700 }}>
              {activePage === 'coa' ? 'Chart of Accounts' : 'Vouchers'}
            </h2>
            <p style={{ marginTop: '12px', color: 'var(--text-secondary)' }}>
              This links to your existing {activePage === 'coa' ? 'Chart of Accounts' : 'Voucher'} module.
              Wire it up by passing an <code>onAppNavigate</code> handler to{' '}
              <code>&lt;GeneralLedgerPage /&gt;</code>.
            </p>
          </div>
        );
      default:
        return <LedgerDashboard onNavigate={handleNavigate} />;
    }
  };

  const meta = SECTION_META[activePage] || SECTION_META.dashboard;

  return (
    <div className="gl-app" style={{ '--gl-base': `${fontSize}px` }}>
      <Sidebar
        activePage={activePage}
        onNavigate={handleNavigate}
        mobileOpen={mobileOpen}
        onOverlayClick={() => setMobileOpen(false)}
        pendingCount={pendingCount}
      />

      <div className="gl-main">
        <Header
          title={meta.title}
          subtitle={meta.subtitle}
          onMenuClick={() => setMobileOpen((open) => !open)}
          fontSize={fontSize}
          onFontSize={setFontSize}
        >
          {onBack && (
            <button className="btn btn-secondary btn-sm" onClick={onBack}>
              Back Home
            </button>
          )}
        </Header>

        <main className="gl-body">
          {renderPage()}
        </main>
      </div>

      <ToastContainer />
    </div>
  );
}
