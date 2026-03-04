import React, { useState } from 'react';
import HomePage from './homepage';
import Accountgroup    from './COA/Accountgroup';
import Accountcategory from './COA/Accountcategory';
import Accountclass    from './COA/Accountclass';
import Accountaccount  from './COA/Accountaccount';

function App() {
  const [currentPage, setCurrentPage] = useState('home');

  const navigate = (page) => setCurrentPage(page);
  const goHome   = () => setCurrentPage('home');

  return (
    <div className="App">
      {currentPage === 'home'             && <HomePage        onNavigate={navigate} />}
      {currentPage === 'account-group'    && <Accountgroup    onBack={goHome} />}
      {currentPage === 'account-category' && <Accountcategory onBack={goHome} />}
      {currentPage === 'account-class'    && <Accountclass    onBack={goHome} />}
      {currentPage === 'account-account'  && <Accountaccount  onBack={goHome} />}
    </div>
  );
}

export default App;