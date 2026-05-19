import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBalance } from '../features/wallet/walletSlice';
import { fetchSummary } from '../features/transactions/transactionSlice';
import { fetchProfile } from '../features/auth/authSlice';
import Sidebar from '../components/Sidebar';
import Receipt from '../components/Receipt';
import api from '../app/api';

export default function Dashboard() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { balance } = useSelector((state) => state.wallet);
  const { summary } = useSelector((state) => state.transactions);
  const [selectedTx, setSelectedTx] = useState(null);

  useEffect(() => {
    dispatch(fetchProfile());
    dispatch(fetchBalance());
    dispatch(fetchSummary());
  }, [dispatch]);

  const handleSentClick = async () => {
    try {
      const response = await api.get('/transactions/history', { params: { limit: 50, type: 'transfer', status: 'success' } });
      const sentTxs = response.data.transactions.filter(tx => tx.senderId === user?.id);
      if (sentTxs.length > 0) {
        setSelectedTx(sentTxs[0]);
      } else {
        alert("No sent transactions found.");
      }
    } catch (e) {
      alert("Failed to load transaction receipt.");
    }
  };

  const handleReceivedClick = async () => {
    try {
      const response = await api.get('/transactions/history', { params: { limit: 50, type: 'transfer', status: 'success' } });
      const receivedTxs = response.data.transactions.filter(tx => tx.receiverId === user?.id);
      if (receivedTxs.length > 0) {
        setSelectedTx(receivedTxs[0]);
      } else {
        alert("No received transactions found.");
      }
    } catch (e) {
      alert("Failed to load transaction receipt.");
    }
  };

  const handleTopupsClick = async () => {
    try {
      const response = await api.get('/transactions/history', { params: { limit: 50, type: 'topup', status: 'success' } });
      if (response.data.transactions.length > 0) {
        setSelectedTx(response.data.transactions[0]);
      } else {
        alert("No top-up transactions found.");
      }
    } catch (e) {
      alert("Failed to load transaction receipt.");
    }
  };

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
          <div 
            className="stat-card" 
            style={{ cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
            onClick={handleSentClick}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <div className="stat-icon" style={{ background: 'var(--danger-light)' }}>📤</div>
            <p className="stat-label">Money Sent</p>
            <p className="stat-value" style={{ color: 'var(--danger)' }}>
              PKR {parseFloat(summary?.monthlySent || 0).toLocaleString()}
            </p>
          </div>
          <div 
            className="stat-card" 
            style={{ cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
            onClick={handleReceivedClick}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <div className="stat-icon" style={{ background: 'var(--success-light)' }}>📥</div>
            <p className="stat-label">Money Received</p>
            <p className="stat-value" style={{ color: 'var(--success)' }}>
              PKR {parseFloat(summary?.monthlyReceived || 0).toLocaleString()}
            </p>
          </div>
          <div 
            className="stat-card" 
            style={{ cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
            onClick={handleTopupsClick}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
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
        {selectedTx && (
          <Receipt transaction={selectedTx} onClose={() => setSelectedTx(null)} />
        )}
      </main>
    </div>
  );
}
