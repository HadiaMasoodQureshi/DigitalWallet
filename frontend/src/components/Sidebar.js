import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { logout } from '../features/auth/authSlice';

export default function Sidebar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);

  const isAdminPortal = location.pathname.startsWith('/admin') && user?.role === 'admin';

  const handleLogout = () => {
    dispatch(logout());
    if (isAdminPortal) {
      navigate('/login?portal=admin');
    } else {
      navigate('/login');
    }
  };

  const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U';

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">{isAdminPortal ? '🛡️' : '💳'}</div>
        <h2>{isAdminPortal ? 'Admin Panel' : 'PayWallet'}</h2>
      </div>

      <nav className="sidebar-nav">
        {isAdminPortal ? (
          /* Admin Specific Links - Strictly Management Only */
          <>
            <NavLink to="/admin" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <span className="icon">📊</span> Overview
            </NavLink>
          </>
        ) : (
          /* User Specific Links */
          <>
            <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <span className="icon">🏠</span> Dashboard
            </NavLink>
            <NavLink to="/transfer" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <span className="icon">💸</span> Transfer
            </NavLink>
            <NavLink to="/card-topup" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <span className="icon">💳</span> Card Top-Up
            </NavLink>
            <NavLink to="/withdraw" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <span className="icon">📤</span> Withdraw
            </NavLink>
            <NavLink to="/history" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <span className="icon">📜</span> History
            </NavLink>
            <NavLink to="/profile" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <span className="icon">👤</span> Profile
            </NavLink>
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="avatar">{initials}</div>
          <div className="sidebar-user-info">
            <p>{user?.name || 'User'}</p>
            <span>{user?.role}</span>
          </div>
        </div>
        <button className="btn-logout" onClick={handleLogout}>🚪 Logout</button>
      </div>
    </aside>
  );
}
