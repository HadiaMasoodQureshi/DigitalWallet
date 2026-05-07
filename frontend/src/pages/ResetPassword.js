import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../app/api';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return setError('Passwords do not match');
    }
    if (newPassword.length < 8) {
      return setError('Password must be at least 8 characters');
    }

    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await api.post('/auth/reset-password', { token, newPassword });
      setMessage(res.data.message);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired token');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="auth-page-3d user-context">
        <div className="auth-wrapper">
          <div className="card-face" style={{ textAlign: 'center', padding: '40px' }}>
            <h2>Invalid Request</h2>
            <p>No reset token found.</p>
            <button className="btn-primary-3d" onClick={() => navigate('/login')}>Back to Login</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page-3d user-context">
      <div className="mesh"></div>
      <div className="grid-overlay"></div>
      
      <div className="auth-wrapper">
        <div className="card-scene" style={{ width: '400px', height: 'auto' }}>
          <div className="card-face" style={{ position: 'relative' }}>
            <div className="card-header">
              <div className="card-title">New Password 🔒</div>
              <div className="card-subtitle">Set your new account password</div>
            </div>

            {message && <div className="alert alert-success">{message}</div>}
            {error && <div className="alert alert-error">{error}</div>}

            {!message && (
              <form onSubmit={handleSubmit}>
                <div className="field-3d">
                  <label>New Password</label>
                  <div className="input-wrap-3d">
                    <span className="input-icon-3d">🔒</span>
                    <input 
                      type="password" 
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="field-3d">
                  <label>Confirm Password</label>
                  <div className="input-wrap-3d">
                    <span className="input-icon-3d">✅</span>
                    <input 
                      type="password" 
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="btn-primary-3d" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Password →'}
                </button>
              </form>
            )}

            <div className="auth-switch" style={{ marginTop: '20px', textAlign: 'center' }}>
              <span 
                style={{ color: 'var(--green)', cursor: 'pointer', fontWeight: 600 }} 
                onClick={() => navigate('/login')}
              >
                Back to Login
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
