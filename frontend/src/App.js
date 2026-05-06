import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import PrivateRoute from './components/PrivateRoute';

// Temporary Dashboard Components (Inhein baad mein alag files mein le jayenge)
const AdminDash = () => <div className="p-10 text-2xl font-bold text-navy-800">Welcome to Admin Dashboard</div>;
const ManagerDash = () => <div className="p-10 text-2xl font-bold text-emerald-700">Welcome to Manager Dashboard</div>;
const AccountantDash = () => <div className="p-10 text-2xl font-bold text-blue-600">Welcome to Accountant Dashboard</div>;

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* Protected Routes */}
      <Route path="/admin-dashboard" element={<PrivateRoute><AdminDash /></PrivateRoute>} />
      <Route path="/manager-dashboard" element={<PrivateRoute><ManagerDash /></PrivateRoute>} />
      <Route path="/accountant-dashboard" element={<PrivateRoute><AccountantDash /></PrivateRoute>} />
      
      <Route path="/" element={<Login />} />
    </Routes>
  );
}

// Yeh line sab se zaroori hai (Default Export)
export default App;