import React, { useState } from 'react';
import './App.css';
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
    <div className="App">
      <Navbar onNavigate={navigate} active={currentPage} onBack={goBack} canGoBack={currentPage !== 'home'} />
      {currentPage === 'home'             && <HomePage        onNavigate={navigate} />}
      {currentPage === 'account-group'    && <Accountgroup    onBack={goHome} />}
      {currentPage === 'account-category' && <Accountcategory onBack={goHome} />}
      {currentPage === 'account-class'    && <Accountclass    onBack={goHome} />}
      {currentPage === 'account-account'  && <Accountaccount  onBack={goHome} />}
      {currentPage === 'vouchers'         && <VouchersPage    onBack={goHome} onAppNavigate={navigate} />}
      {currentPage === 'templates'        && <TemplatesPage   onBack={goHome} />}
      {currentPage === 'general-ledger'   && <GeneralLedgerPage onBack={goHome} onAppNavigate={navigate} />}
      {currentPage === 'reports'          && <FinancialStatementsPage onBack={goHome} />}
      {currentPage === 'reporting' && <ReportingPage onBack={goHome} />}

    </div>
  );
}

export default App;