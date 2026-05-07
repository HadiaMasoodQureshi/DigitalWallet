import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBalance } from '../features/wallet/walletSlice';
import { fetchSummary } from '../features/transactions/transactionSlice';
import { fetchProfile } from '../features/auth/authSlice';
import Sidebar from '../components/Sidebar';

export default function Dashboard() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { balance } = useSelector((state) => state.wallet);
  const { summary } = useSelector((state) => state.transactions);

  useEffect(() => {
    dispatch(fetchProfile());
    dispatch(fetchBalance());
    dispatch(fetchSummary());
  }, [dispatch]);

  return (
    <div className="layout user-portal">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1>👋 Hello, {user?.name?.split(' ')[0] || 'User'}!</h1>
          <p>Here's your financial overview for this month</p>
        </div>

        {/* Balance Card */}
        <div className="balance-card" style={{ marginBottom: '28px' }}>
          <p className="balance-label">💰 Available Balance</p>
          <p className="balance-amount">
            <span className="balance-currency">PKR </span>
            {parseFloat(balance).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
          </p>
          <div style={{ display: 'flex', gap: '12px', marginTop: '20px', position: 'relative', zIndex: 1 }}>
            <a href="/transfer" style={{ textDecoration: 'none' }}>
              <button className="btn btn-primary">💸 Send Money</button>
            </a>
            <a href="/topup" style={{ textDecoration: 'none' }}>
              <button className="btn btn-secondary">➕ Top Up</button>
            </a>
          </div>
        </div>

        {/* Monthly Summary */}
        <p className="section-title">📊 Monthly Summary</p>
        <div className="grid-3" style={{ marginBottom: '28px' }}>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'var(--danger-light)' }}>📤</div>
            <p className="stat-label">Money Sent</p>
            <p className="stat-value" style={{ color: 'var(--danger)' }}>
              PKR {parseFloat(summary?.monthlySent || 0).toLocaleString()}
            </p>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'var(--success-light)' }}>📥</div>
            <p className="stat-label">Money Received</p>
            <p className="stat-value" style={{ color: 'var(--success)' }}>
              PKR {parseFloat(summary?.monthlyReceived || 0).toLocaleString()}
            </p>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'var(--accent-light)' }}>💳</div>
            <p className="stat-label">Total Top-Ups</p>
            <p className="stat-value" style={{ color: 'var(--accent)' }}>
              PKR {parseFloat(summary?.monthlyTopup || 0).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <p className="section-title">⚡ Quick Actions</p>
        <div className="grid-2">
          <div className="card" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ fontSize: '36px' }}>💸</div>
            <div>
              <p style={{ fontWeight: 700, marginBottom: '4px' }}>Peer-to-Peer Transfer</p>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Send money to any registered user</p>
              <a href="/transfer"><button className="btn btn-primary" style={{ marginTop: '12px', padding: '8px 16px', fontSize: '13px' }}>Send Now</button></a>
            </div>
          </div>
          <div className="card" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ fontSize: '36px' }}>📋</div>
            <div>
              <p style={{ fontWeight: 700, marginBottom: '4px' }}>Transaction History</p>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>View all your credits and debits</p>
              <a href="/history"><button className="btn btn-secondary" style={{ marginTop: '12px', padding: '8px 16px', fontSize: '13px' }}>View History</button></a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
