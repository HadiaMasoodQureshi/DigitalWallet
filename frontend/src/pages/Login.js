import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { loginUser, registerUser, clearMessages } from '../features/auth/authSlice';

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loading, error, token, user, success } = useSelector((state) => state.auth);

  // --- States ---
  const [isFlipped, setIsFlipped] = useState(false);
  const [selectedRole, setSelectedRole] = useState(searchParams.get('portal') === 'admin' ? 'admin' : 'user');
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [regForm, setRegForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  
  // Stats counters
  const [userCount, setUserCount] = useState(0);
  const [txCount, setTxCount] = useState(0);

  // Refs for 3D tilt
  const flipperRef = useRef(null);

  // --- Initial Context ---
  useEffect(() => {
    if (token && user) {
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    }
    return () => dispatch(clearMessages());
  }, [token, user, navigate, dispatch]);

  // Show success message on register side — don't auto-flip back
  useEffect(() => {
    if (success && isFlipped) {
      dispatch(clearMessages());
    }
  }, [success, isFlipped, dispatch]);

  // --- Animations ---
  useEffect(() => {
    // Animate counters
    const interval = setInterval(() => {
      setUserCount(prev => prev < 1240 ? prev + 40 : 1240);
      setTxCount(prev => prev < 98 ? prev + 2 : 98);
    }, 40);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    dispatch(loginUser(loginForm));
  };

  const handleRegister = (e) => {
    e.preventDefault();
    dispatch(registerUser(regForm));
  };

  const toggleFlip = () => {
    if (selectedRole === 'admin') return; // Admin can't register
    setIsFlipped(!isFlipped);
  };

  // --- Render Helpers ---
  const icons = ['💳','💰','📲','🏦','💸','📊','🔐','💹','🤝','📱','💵','🏧'];

  return (
    <div 
      className={`auth-page-3d ${selectedRole === 'user' ? 'user-context' : ''}`}
    >
      {/* Background Layers */}
      <div className="mesh"></div>
      <div className="grid-overlay"></div>
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>
      <div className="orb orb-3"></div>

      {/* Floating Icons */}
      <div className="bg-icons">
        {[...Array(20)].map((_, i) => (
          <div 
            key={i} 
            className="bg-icon"
            style={{
              left: `${Math.random() * 100}vw`,
              animationDuration: `${15 + Math.random() * 20}s`,
              animationDelay: `-${Math.random() * 20}s`,
              fontSize: `${1.5 + Math.random() * 2}rem`
            }}
          >
            {icons[i % icons.length]}
          </div>
        ))}
      </div>

      <div className="auth-wrapper">
        {/* Left Brand Panel */}
        <div className="brand-panel">
          <div className="brand-logo-3d">
            <div className="logo-icon-3d">🛡️</div>
            <div className="logo-text-3d">PayWallet</div>
          </div>
          <h1 className="brand-headline">Digital<br/>Payments,<br/>Reimagined.</h1>
          <p className="brand-sub">Send money instantly, track every transaction, and manage your digital wallet — all from one powerful platform.</p>
          <div className="brand-stats">
            <div className="stat-pill">
              <div className="stat-num">{userCount}+</div>
              <div className="stat-label">Active Users</div>
            </div>
            <div className="stat-pill">
              <div className="stat-num">{txCount}K+</div>
              <div className="stat-label">Transactions</div>
            </div>
          </div>
        </div>

        {/* 3D Card Scene */}
        <div className="card-scene">
          <div className={`card-flipper ${isFlipped ? 'flipped' : ''}`}>
            
            {/* FRONT: LOGIN */}
            <div className="card-face card-front">
              <div className="card-header">
                <div className="card-title">Welcome back 👋</div>
                <div className="card-subtitle">Sign in to your {selectedRole} portal</div>
              </div>

              {/* Role Selection */}
              <div className="role-pills-3d">
                <div className={`role-pill-3d ${selectedRole === 'user' ? 'active' : ''}`} onClick={() => {setSelectedRole('user'); setIsFlipped(false);}}>
                  👤 User
                </div>
                <div className={`role-pill-3d ${selectedRole === 'admin' ? 'active' : ''}`} onClick={() => {setSelectedRole('admin'); setIsFlipped(false);}}>
                  🛡️ Admin
                </div>
              </div>

              {error && <div className="alert alert-error" style={{marginBottom: '10px', fontSize: '12px'}}>{error}</div>}

              <form onSubmit={handleLogin}>
                <div className="field-3d">
                  <label>Email Address</label>
                  <div className="input-wrap-3d">
                    <span className="input-icon-3d">📧</span>
                    <input 
                      type="email" 
                      placeholder="you@example.com"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="field-3d">
                  <label>Password</label>
                  <div className="input-wrap-3d">
                    <span className="input-icon-3d">🔒</span>
                    <input 
                      type={showPass ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                      required
                    />
                    <button type="button" className="eye-btn-3d" onClick={() => setShowPass(!showPass)}>
                      {showPass ? '🙈' : '👁️'}
                    </button>
                  </div>
                  <div style={{ textAlign: 'right', marginTop: '4px' }}>
                    <span 
                      style={{ fontSize: '12px', color: 'var(--green)', cursor: 'pointer', fontWeight: 500 }}
                      onClick={() => navigate('/forgot-password')}
                    >
                      Forgot password?
                    </span>
                  </div>
                </div>

                <button type="submit" className="btn-primary-3d" disabled={loading}>
                  {loading ? 'Processing...' : 'Sign In →'}
                </button>
              </form>

              {selectedRole === 'user' && (
                <div className="auth-switch" style={{marginTop: '20px', color: 'var(--muted)'}}>
                  Don't have an account? <span style={{color: 'var(--green)', cursor: 'pointer', fontWeight: 600}} onClick={toggleFlip}>Register now</span>
                </div>
              )}
            </div>

            {/* BACK: REGISTER */}
            <div className="card-face card-back">
              <div className="card-header">
                <div className="card-title">Create Account ✨</div>
                <div className="card-subtitle">Join PayWallet as a new user</div>
              </div>

              <form onSubmit={handleRegister}>
                <div className="field-3d">
                  <label>Full Name</label>
                  <div className="input-wrap-3d">
                    <span className="input-icon-3d">✍️</span>
                    <input 
                      type="text" 
                      placeholder="Your Name"
                      value={regForm.name}
                      onChange={(e) => setRegForm({...regForm, name: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="field-3d">
                  <label>Email Address</label>
                  <div className="input-wrap-3d">
                    <span className="input-icon-3d">📧</span>
                    <input 
                      type="email" 
                      placeholder="you@email.com"
                      value={regForm.email}
                      onChange={(e) => setRegForm({...regForm, email: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="field-3d">
                  <label>Password</label>
                  <div className="input-wrap-3d">
                    <span className="input-icon-3d">🔒</span>
                    <input 
                      type="password" 
                      placeholder="Min. 8 characters"
                      value={regForm.password}
                      onChange={(e) => setRegForm({...regForm, password: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="btn-primary-3d" disabled={loading}>
                  {loading ? 'Creating...' : 'Register Account 🚀'}
                </button>
              </form>

              <div className="auth-switch" style={{marginTop: '20px', color: 'var(--muted)'}}>
                Already have an account? <span style={{color: 'var(--green)', cursor: 'pointer', fontWeight: 600}} onClick={toggleFlip}>Sign in</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
