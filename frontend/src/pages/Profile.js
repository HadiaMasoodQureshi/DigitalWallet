import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProfile } from '../features/auth/authSlice';
import { fetchBalance } from '../features/wallet/walletSlice';
import api from '../app/api';
import Sidebar from '../components/Sidebar';

export default function Profile() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { balance } = useSelector((state) => state.wallet);

  const [name, setName] = useState('');
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchProfile());
    dispatch(fetchBalance());
  }, [dispatch]);

  useEffect(() => {
    if (user?.name) setName(user.name);
  }, [user]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      await api.put('/profile/update', { name });
      dispatch(fetchProfile());
      setMsg({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Update failed' });
    } finally {
      setLoading(false);
    }
  };

  const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U';

  return (
    <div className="layout user-portal">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1>👤 My Profile</h1>
          <p>Manage your account information</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px', alignItems: 'start' }}>
          {/* Profile Card */}
          <div className="card" style={{ textAlign: 'center' }}>
            <div className="avatar" style={{ width: '72px', height: '72px', fontSize: '26px', margin: '0 auto 16px', borderRadius: '50%' }}>{initials}</div>
            <p style={{ fontWeight: 700, fontSize: '18px', marginBottom: '4px' }}>{user?.name}</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '12px' }}>{user?.email}</p>
            <span className={`badge ${user?.role === 'admin' ? 'badge-accent' : 'badge-success'}`}>
              {user?.role === 'admin' ? '🛡️ Admin' : '👤 User'}
            </span>
            <div style={{ marginTop: '20px', padding: '16px', background: 'var(--bg-primary)', borderRadius: '10px' }}>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Wallet Balance</p>
              <p style={{ fontSize: '24px', fontWeight: 800, color: 'var(--success)' }}>
                PKR {parseFloat(balance).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* Edit Form */}
          <div className="card">
            <h2 className="section-title">Update Profile</h2>
            {msg && <div className={`alert alert-${msg.type === 'success' ? 'success' : 'error'}`}>{msg.text}</div>}

            <form onSubmit={handleUpdate}>
              <div className="form-group">
                <label htmlFor="profile-name">Full Name</label>
                <input
                  id="profile-name"
                  className="form-control"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input className="form-control" type="email" value={user?.email || ''} disabled style={{ opacity: 0.6 }} />
              </div>
              <div className="form-group">
                <label>Role</label>
                <input className="form-control" type="text" value={user?.role || ''} disabled style={{ opacity: 0.6 }} />
              </div>
              <button id="profile-update-btn" className="btn btn-primary" type="submit" disabled={loading}>
                {loading ? <><span className="spinner"></span> Saving...</> : '💾 Save Changes'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
