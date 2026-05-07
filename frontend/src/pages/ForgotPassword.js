import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../app/api';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await api.post('/auth/forgot-password', { email });
      setMessage(res.data.message);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-3d user-context">
      <div className="mesh"></div>
      <div className="grid-overlay"></div>
      
      <div className="auth-wrapper">
        <div className="card-scene" style={{ width: '400px', height: 'auto' }}>
          <div className="card-face" style={{ position: 'relative' }}>
            <div className="card-header">
              <div className="card-title">Reset Password 🔑</div>
              <div className="card-subtitle">Enter your email to receive a reset link</div>
            </div>

            {message && <div className="alert alert-success">{message}</div>}
            {error && <div className="alert alert-error">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="field-3d">
                <label>Email Address</label>
                <div className="input-wrap-3d">
                  <span className="input-icon-3d">📧</span>
                  <input 
                    type="email" 
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn-primary-3d" disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Link →'}
              </button>
            </form>

            <div className="auth-switch" style={{ marginTop: '20px', textAlign: 'center' }}>
              <span 
                style={{ color: 'var(--green)', cursor: 'pointer', fontWeight: 600 }} 
                onClick={() => navigate('/login')}
              >
                ← Back to Login
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
