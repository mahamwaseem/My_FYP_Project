import { createContext, useContext, useState } from 'react'; 
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const login = async (username, password) => {
    try {
      const res = await api.post('/token/', { username, password });
      localStorage.setItem('access', res.data.access);
      localStorage.setItem('refresh', res.data.refresh);
      
      // Fetch profile to get the 'role'
      const profile = await api.get('/auth/profile/');
      setUser(profile.data);

      // Redirect based on role
      if (profile.data.role === 'administrator') navigate('/admin-dashboard');
      else if (profile.data.role === 'manager') navigate('/manager-dashboard');
      else if (profile.data.role === 'accountant') navigate('/accountant-dashboard');
      else navigate('/login');
      
    } catch (err) {
      throw err;
    }
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);