import React, { useState } from 'react';
import './App.css';
import { AuthProvider, RequireAuth, AdminUsers, AuthPage, useAuth, PERMISSIONS } from './Auth';
import HomePage from './HomePage';
import Navbar from './Navbar';
import Accountgroup    from './COA/Accountgroup';
import Accountcategory from './COA/Accountcategory';
import Accountclass    from './COA/Accountclass';
import Accountaccount  from './COA/Accountaccount';
import VouchersPage    from './Vouchers/VouchersPage';
import TemplatesPage   from './VoucherTemplates/TemplatesPage';
import GeneralLedgerPage from './GeneralLedger/GeneralLedger/GeneralLedgerPage';
import FinancialStatementsPage from './FinancialStatements/FinancialStatementsPage';
import ReportingPage from './Reporting/ReportingPage';
import { FinancialDashboard } from './Dashboard';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [history, setHistory] = useState([]);

  const navigate = (page) => {
    if (!page || page === currentPage) return;
    setHistory((prev) => [...prev, currentPage]);
    setCurrentPage(page);
  };

  const goBack = () => {
    setHistory((prev) => {
      if (!prev.length) {
        if (currentPage !== 'home') {
          setCurrentPage('home');
        }
        return prev;
      }
      const previousPage = prev[prev.length - 1];
      setCurrentPage(previousPage);
      return prev.slice(0, -1);
    });
  };

  const goHome = () => {
    if (currentPage === 'home') return;
    setHistory((prev) => [...prev, currentPage]);
    setCurrentPage('home');
  };

  return (
    // AuthProvider supplies auth context to the whole app (so Navbar/buttons can
    // read it) WITHOUT gating it. The public homepage renders freely; each real
    // module is wrapped in <RequireAuth> so opening it triggers the login screen
    // when not signed in. Role permissions still govern access inside.
    <AuthProvider>
      <div className="App">
        <Navbar onNavigate={navigate} active={currentPage} onBack={goBack} canGoBack={currentPage !== 'home'} />

        {/* PUBLIC — landing page, no login required */}
        {currentPage === 'home' && <HomePage onNavigate={navigate} />}

        {/* Sign in — shows the auth page; navigates home once authenticated */}
        {currentPage === 'login' && <LoginRoute onAuthed={goHome} />}

        {/* Financial Dashboard — gated like the other modules */}
        {currentPage === 'dashboard' && (
          <RequireAuth onBack={goHome}>
            <FinancialDashboard onBack={goHome} onNavigate={navigate} />
          </RequireAuth>
        )}

        {/* GATED — every real module requires login (no token = login screen) */}
        {currentPage === 'account-group' && (
          <RequireAuth onBack={goHome}><Accountgroup onBack={goHome} /></RequireAuth>
        )}
        {currentPage === 'account-category' && (
          <RequireAuth onBack={goHome}><Accountcategory onBack={goHome} /></RequireAuth>
        )}
        {currentPage === 'account-class' && (
          <RequireAuth onBack={goHome}><Accountclass onBack={goHome} /></RequireAuth>
        )}
        {currentPage === 'account-account' && (
          <RequireAuth onBack={goHome}><Accountaccount onBack={goHome} /></RequireAuth>
        )}
        {currentPage === 'vouchers' && (
          <RequireAuth onBack={goHome}><VouchersPage onBack={goHome} onAppNavigate={navigate} /></RequireAuth>
        )}
        {currentPage === 'templates' && (
          <RequireAuth onBack={goHome}><TemplatesPage onBack={goHome} /></RequireAuth>
        )}
        {currentPage === 'general-ledger' && (
          <RequireAuth onBack={goHome}><GeneralLedgerPage onBack={goHome} onAppNavigate={navigate} /></RequireAuth>
        )}
        {currentPage === 'reports' && (
          <RequireAuth onBack={goHome}><FinancialStatementsPage onBack={goHome} /></RequireAuth>
        )}
        {currentPage === 'reporting' && (
          <RequireAuth onBack={goHome}><ReportingPage onBack={goHome} /></RequireAuth>
        )}

        {/* Roles & Access — requires login AND admin permission */}
        {currentPage === 'users' && (
          <RequireAuth perm={PERMISSIONS.MANAGE_USERS} onBack={goHome}>
            <AdminUsers onBack={goHome} />
          </RequireAuth>
        )}
      </div>
    </AuthProvider>
  );
}

/**
 * Renders the sign-in / sign-up page. As soon as the user is authenticated
 * (context flips isAuthenticated → true), it returns them to the homepage.
 */
function LoginRoute({ onAuthed }) {
  const { isAuthenticated } = useAuth();
  React.useEffect(() => {
    if (isAuthenticated) onAuthed();
  }, [isAuthenticated, onAuthed]);
  return <AuthPage />;
}

export default App;