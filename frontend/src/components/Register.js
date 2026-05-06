import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Real navigation
import api from '../api/axios'; // Aapka axios instance

const Register = () => {
  const navigate = useNavigate();
  
  // State Management
  const [formData, setFormData] = useState({ 
    username: '', 
    email: '', 
    password: '', 
    role: 'manager' 
  });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Form Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      // Django API call
      const response = await api.post('/auth/register/', formData);
      
      if (response.status === 201 || response.status === 200) {
        setSuccess(true);
        // 2 seconds baad login page pe bhej dega
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (err) {
      // Backend error message handle karna
      const backendError = err.response?.data?.detail || 
                           err.response?.data?.username?.[0] || 
                           'Registration failed. Try a different username.';
      setError(backendError);
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { value: 'administrator', label: 'Administrator', icon: '🛡️', desc: 'Full system access' },
    { value: 'manager', label: 'Manager', icon: '📊', desc: 'Team oversight' },
    { value: 'accountant', label: 'Accountant', icon: '🧾', desc: 'Financial records' },
  ];

  return (
    <>
      {/* Aapki existing <style> tag yahan waisi hi rahegi jaisi aapne bheji thi */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        .rg-root{
          min-height:100vh;display:flex;align-items:center;justify-content:center;
          background:#f0fdf8;font-family:'Plus Jakarta Sans',sans-serif;
          position:relative;overflow:hidden;padding:24px 16px;
        }
        /* ... baki saari CSS jo aapne bheji thi ... */
        .rg-card{ background:#fff;border-radius:24px;padding:44px 40px; width:100%;max-width:460px;position:relative;z-index:1; box-shadow:0 4px 6px -1px rgba(0,0,0,.04),0 20px 60px -10px rgba(5,150,105,.15); border:1px solid rgba(5,150,105,.1); animation:slideUp .5s cubic-bezier(.16,1,.3,1) both; }
        .rg-accent{ position:absolute;top:0;left:24px;right:24px;height:3px; background:linear-gradient(90deg,#059669,#10b981,#34d399); border-radius:0 0 8px 8px; }
        .rg-logo{display:flex;align-items:center;gap:10px;margin-bottom:24px;}
        .rg-logo-icon{ width:40px;height:40px; background:linear-gradient(135deg,#059669,#10b981); border-radius:10px;display:flex;align-items:center;justify-content:center; color:white;font-weight:800;font-size:18px; box-shadow:0 4px 12px rgba(5,150,105,.35); }
        .rg-logo-name{font-size:22px;font-weight:800;color:#064e3b;letter-spacing:-.5px;}
        .rg-badge{ display:inline-flex;align-items:center;gap:5px; background:#ecfdf5;color:#059669;font-size:11px;font-weight:600; padding:3px 9px;border-radius:20px;margin-bottom:16px; }
        .rg-badge-dot{width:6px;height:6px;background:#10b981;border-radius:50%;animation:pulse 2s infinite;}
        .rg-heading{font-size:24px;font-weight:800;color:#111827;letter-spacing:-.5px;margin-bottom:5px;}
        .rg-subtitle{font-size:13.5px;color:#6b7280;margin-bottom:28px;line-height:1.5;}
        .rg-error{ background:#fef2f2;border:1px solid #fecaca;color:#dc2626; font-size:13px;padding:11px 14px;border-radius:10px;margin-bottom:18px; display:flex;align-items:center;gap:8px; }
        .rg-success{ background:#ecfdf5;border:1px solid #6ee7b7;color:#059669; font-size:13px;padding:11px 14px;border-radius:10px;margin-bottom:18px; display:flex;align-items:center;gap:8px; }
        .rg-field{margin-bottom:15px;}
        .rg-label{display:block;font-size:13px;font-weight:600;color:#374151;margin-bottom:6px;}
        .rg-input-wrap{position:relative;}
        .rg-input{ width:100%;padding:11px 14px;border:1.5px solid #e5e7eb;border-radius:12px; font-size:14px;font-family:inherit;color:#111827;background:#f9fafb; transition:all .2s ease;outline:none; }
        .rg-input:focus{border-color:#059669;background:#fff;box-shadow:0 0 0 3px rgba(5,150,105,.12);}
        .rg-eye{ position:absolute;right:12px;top:50%;transform:translateY(-50%); background:none;border:none;cursor:pointer;color:#9ca3af;padding:4px; display:flex;align-items:center;transition:color .2s; }
        .rg-roles{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:6px;}
        .rg-role{ border:1.5px solid #e5e7eb;border-radius:12px;padding:10px 8px; text-align:center;cursor:pointer;transition:all .2s ease;background:#f9fafb; }
        .rg-role.active{ border-color:#059669;background:#ecfdf5; box-shadow:0 0 0 3px rgba(5,150,105,.1); }
        .rg-role-icon{font-size:20px;margin-bottom:4px;}
        .rg-role-label{font-size:12px;font-weight:700;color:#111827;}
        .rg-role-desc{font-size:10.5px;color:#6b7280;margin-top:1px;}
        .rg-divider{display:flex;align-items:center;gap:12px;margin:6px 0 16px;}
        .rg-divider-line{flex:1;height:1px;background:#f0f0f0;}
        .rg-divider-text{font-size:12px;color:#c4c4c4;font-weight:500;}
        .rg-btn{ width:100%;padding:13px; background:linear-gradient(135deg,#059669,#047857); color:white;border:none;border-radius:12px; font-size:15px;font-weight:700;font-family:inherit; cursor:pointer;margin-top:6px;transition:all .2s ease; display:flex;align-items:center;justify-content:center;gap:8px; box-shadow:0 4px 14px rgba(5,150,105,.4); }
        .rg-btn:disabled{opacity:.75;cursor:not-allowed;}
        .rg-spinner{ width:18px;height:18px;border:2.5px solid rgba(255,255,255,.4); border-top-color:white;border-radius:50%;animation:spin .7s linear infinite; }
        @keyframes spin{to{transform:rotate(360deg)}}
        .rg-footer{text-align:center;margin-top:20px;font-size:13.5px;color:#6b7280;}
        .rg-link{color:#059669;font-weight:700;cursor:pointer;transition:color .2s;}
        .rg-steps{display:flex;align-items:center;gap:6px;margin-bottom:24px;}
        .rg-step{flex:1;height:3px;border-radius:2px;background:#e5e7eb;transition:background .4s;}
        .rg-step.done{background:linear-gradient(90deg,#059669,#10b981);}
      `}</style>

      <div className="rg-root">
        <div className="rg-card">
          <div className="rg-accent" />
          <div className="rg-logo">
            <div className="rg-logo-icon">F</div>
            <span className="rg-logo-name">FinTrack</span>
          </div>

          <div className="rg-badge">
            <span className="rg-badge-dot" />
            Free Account
          </div>

          <h1 className="rg-heading">Create Account</h1>
          <p className="rg-subtitle">Join the complete accounting platform for modern business.</p>

          {/* Feedback Messages */}
          {error && <div className="rg-error">⚠️ {error}</div>}
          {success && <div className="rg-success">✅ Registration Successful! Redirecting...</div>}

          {/* Form with Real onSubmit */}
          <form onSubmit={handleSubmit}>
            <div className="rg-field">
              <label className="rg-label">Username</label>
              <input 
                className="rg-input" 
                type="text" 
                placeholder="Choose a username" 
                required
                value={formData.username}
                onChange={e => setFormData({...formData, username: e.target.value})} 
              />
            </div>

            <div className="rg-field">
              <label className="rg-label">Email Address</label>
              <input 
                className="rg-input" 
                type="email" 
                placeholder="name@company.com" 
                required
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})} 
              />
            </div>

            <div className="rg-field">
              <label className="rg-label">Password</label>
              <div className="rg-input-wrap">
                <input 
                  className="rg-input" 
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••" 
                  required 
                  style={{paddingRight:'42px'}}
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})} 
                />
                <button type="button" className="rg-eye" onClick={() => setShowPass(!showPass)}>
                  {showPass ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div className="rg-field">
              <label className="rg-label">Select Your Role</label>
              <div className="rg-roles">
                {roles.map(r => (
                  <div key={r.value}
                    className={`rg-role ${formData.role === r.value ? 'active' : ''}`}
                    onClick={() => setFormData({...formData, role: r.value})}>
                    <div className="rg-role-icon">{r.icon}</div>
                    <div className="rg-role-label">{r.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <button type="submit" className="rg-btn" disabled={loading || success}>
              {loading ? <div className="rg-spinner"/> : "Register Now"}
            </button>
          </form>

          <p className="rg-footer">
            Already have an account?{' '}
            <span className="rg-link" onClick={() => navigate('/login')}>Login</span>
          </p>
        </div>
      </div>
    </>
  );
};

export default Register;