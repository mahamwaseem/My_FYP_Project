import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  .ft-root {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f0faf9;
    background-image:
      radial-gradient(ellipse 80% 60% at 50% -10%, rgba(28,166,151,0.12) 0%, transparent 70%),
      radial-gradient(ellipse 40% 40% at 80% 80%, rgba(28,166,151,0.07) 0%, transparent 60%);
    font-family: 'Sora', sans-serif;
    padding: 24px;
  }

  .ft-card {
    width: 100%;
    max-width: 420px;
    background: #ffffff;
    border: 1px solid rgba(28,166,151,0.15);
    border-radius: 20px;
    padding: 40px 36px;
    position: relative;
    overflow: hidden;
    box-shadow:
      0 4px 6px rgba(28,166,151,0.04),
      0 20px 50px rgba(28,166,151,0.08),
      0 1px 0 rgba(255,255,255,0.9) inset;
    animation: cardIn 0.5s cubic-bezier(0.16,1,0.3,1) both;
  }

  @keyframes cardIn {
    from { opacity: 0; transform: translateY(24px) scale(0.98); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  .ft-card-accent {
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, #1ca697, #2dd4bf, #1ca697, transparent);
  }

  .ft-card-glow {
    position: absolute;
    top: -60px; left: 50%;
    transform: translateX(-50%);
    width: 200px; height: 120px;
    background: radial-gradient(ellipse, rgba(28,166,151,0.08) 0%, transparent 70%);
    pointer-events: none;
  }

  .ft-logo {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 28px;
  }

  .ft-logo-icon {
    width: 36px; height: 36px;
    background: linear-gradient(135deg, #1ca697, #148f82);
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-family: 'JetBrains Mono', monospace;
    font-weight: 500;
    font-size: 16px;
    color: #fff;
    box-shadow: 0 4px 16px rgba(28,166,151,0.3);
  }

  .ft-logo-name {
    font-size: 18px;
    font-weight: 600;
    color: #0f2e2b;
    letter-spacing: -0.3px;
  }

  .ft-badge {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 5px 12px;
    background: rgba(28,166,151,0.08);
    border: 1px solid rgba(28,166,151,0.2);
    border-radius: 100px;
    font-size: 11px;
    font-weight: 500;
    color: #1ca697;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    margin-bottom: 20px;
  }

  .ft-badge-dot {
    width: 6px; height: 6px;
    background: #1ca697;
    border-radius: 50%;
    box-shadow: 0 0 8px #1ca697;
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.5; transform: scale(0.85); }
  }

  .ft-heading {
    font-size: 26px;
    font-weight: 700;
    color: #0f2e2b;
    letter-spacing: -0.6px;
    margin-bottom: 6px;
    line-height: 1.2;
  }

  .ft-subtitle {
    font-size: 13.5px;
    color: #6b9e9a;
    margin-bottom: 28px;
    line-height: 1.5;
  }

  .ft-error {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 14px;
    background: rgba(239,68,68,0.06);
    border: 1px solid rgba(239,68,68,0.2);
    border-radius: 10px;
    color: #dc2626;
    font-size: 13px;
    margin-bottom: 20px;
    animation: shake 0.4s ease;
  }

  @keyframes shake {
    0%,100% { transform: translateX(0); }
    20%      { transform: translateX(-6px); }
    60%      { transform: translateX(6px); }
  }

  .ft-field {
    margin-bottom: 18px;
  }

  .ft-label {
    display: block;
    font-size: 12px;
    font-weight: 500;
    color: #4a7c78;
    letter-spacing: 0.4px;
    text-transform: uppercase;
    margin-bottom: 8px;
  }

  .ft-input-wrap {
    position: relative;
  }

  .ft-input {
    width: 100%;
    padding: 12px 16px;
    background: #f7fffe;
    border: 1px solid rgba(28,166,151,0.2);
    border-radius: 11px;
    color: #0f2e2b;
    font-size: 14px;
    font-family: 'Sora', sans-serif;
    outline: none;
    transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
  }

  .ft-input::placeholder { color: #b0cece; }

  .ft-input:focus {
    border-color: #1ca697;
    background: #ffffff;
    box-shadow: 0 0 0 3px rgba(28,166,151,0.1);
  }

  .ft-eye-btn {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: #1ca697;
    cursor: pointer;
    font-size: 11px;
    font-family: 'Sora', sans-serif;
    font-weight: 500;
    letter-spacing: 0.3px;
    text-transform: uppercase;
    padding: 4px 6px;
    border-radius: 5px;
    transition: color 0.2s, background 0.2s;
  }

  .ft-eye-btn:hover {
    background: rgba(28,166,151,0.08);
  }

  .ft-submit {
    width: 100%;
    padding: 13px;
    margin-top: 8px;
    background: linear-gradient(135deg, #1ca697 0%, #148f82 100%);
    border: none;
    border-radius: 11px;
    color: #fff;
    font-size: 14.5px;
    font-weight: 600;
    font-family: 'Sora', sans-serif;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
    box-shadow: 0 4px 20px rgba(28,166,151,0.3);
    letter-spacing: -0.2px;
  }

  .ft-submit:hover:not(:disabled) {
    opacity: 0.9;
    transform: translateY(-1px);
    box-shadow: 0 8px 28px rgba(28,166,151,0.4);
  }

  .ft-submit:active:not(:disabled) {
    transform: translateY(0);
  }

  .ft-submit:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .ft-spinner {
    width: 18px; height: 18px;
    border: 2px solid rgba(255,255,255,0.35);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  .ft-footer {
    text-align: center;
    margin-top: 22px;
    font-size: 13px;
    color: #6b9e9a;
  }

  .ft-link {
    color: #1ca697;
    font-weight: 600;
    cursor: pointer;
    transition: color 0.15s;
  }

  .ft-link:hover { color: #148f82; }
`;

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.username, form.password);
    } catch (err) {
      setError('Invalid username or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{styles}</style>
      <div className="ft-root">
        <div className="ft-card">
          <div className="ft-card-accent" />
          <div className="ft-card-glow" />

          <div className="ft-logo">
            <div className="ft-logo-icon">F</div>
            <span className="ft-logo-name">FinTrack</span>
          </div>

          <div className="ft-badge">
            <span className="ft-badge-dot" />
            Secure Login
          </div>

          <h1 className="ft-heading">Welcome Back</h1>
          <p className="ft-subtitle">The complete accounting platform for modern business</p>

          {error && (
            <div className="ft-error">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10A8 8 0 11 2 10a8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="ft-field">
              <label className="ft-label">Username</label>
              <div className="ft-input-wrap">
                <input
                  className="ft-input"
                  type="text"
                  placeholder="Enter your username"
                  required
                  value={form.username}
                  onChange={e => setForm({ ...form, username: e.target.value })}
                />
              </div>
            </div>

            <div className="ft-field">
              <label className="ft-label">Password</label>
              <div className="ft-input-wrap">
                <input
                  className="ft-input"
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  required
                  style={{ paddingRight: '58px' }}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                />
                <button
                  type="button"
                  className="ft-eye-btn"
                  onClick={() => setShowPass(v => !v)}
                >
                  {showPass ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button type="submit" className="ft-submit" disabled={loading}>
              {loading ? <div className="ft-spinner" /> : "Sign In"}
            </button>
          </form>

          <p className="ft-footer">
            Don't have an account?{' '}
            <span className="ft-link" onClick={() => navigate('/register')}>Register Now</span>
          </p>
        </div>
      </div>
    </>
  );
}