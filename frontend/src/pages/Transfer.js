import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import DropIn from 'braintree-web-drop-in-react';
import { sendMoney, clearTxMessages } from '../features/transactions/transactionSlice';
import { fetchBalance } from '../features/wallet/walletSlice';
import api from '../app/api';
import Sidebar from '../components/Sidebar';

export default function Transfer() {
  const dispatch = useDispatch();
  const { loading: txLoading, error: txError, success: txSuccess } = useSelector((state) => state.transactions);
  const { balance } = useSelector((state) => state.wallet);
  
  const [form, setForm] = useState({ receiverEmail: '', amount: '', description: '' });
  const [payMethod, setPayMethod] = useState('wallet'); // 'wallet' or 'card'
  
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [clientToken, setClientToken] = useState(null);
  const [dropinKey, setDropinKey] = useState(0); // Add key to force reset
  const dropinInstance = useRef(null);

  // New Contact Modal State
  const [showModal, setShowModal] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', email: '' });
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState(null);

  const fetchUsers = () => {
    api.get('/users').then(res => setUsers(res.data)).catch(() => {});
  };

  useEffect(() => {
    dispatch(fetchBalance());
    fetchUsers();
    api.get('/braintree/token').then(res => setClientToken(res.data.clientToken)).catch(() => {});
    return () => dispatch(clearTxMessages());
  }, [dispatch]);

  useEffect(() => {
    if (txSuccess) {
      dispatch(fetchBalance());
      setForm({ receiverEmail: '', amount: '', description: '' });
      setTimeout(() => dispatch(clearTxMessages()), 3000);
    }
  }, [txSuccess, dispatch]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amountNum = parseFloat(form.amount);
    
    if (payMethod === 'wallet') {
      dispatch(sendMoney({ ...form, amount: amountNum }));
    } else {
      if (!dropinInstance.current) return;
      try {
        const { nonce } = await dropinInstance.current.requestPaymentMethod();
        const res = await api.post('/braintree/pay-user', { 
          nonce, 
          amount: amountNum, 
          receiverEmail: form.receiverEmail,
          description: form.description
        });
        if (res.data.success) {
          dispatch({ type: 'transactions/send/fulfilled', payload: res.data });
        }
      } catch (err) {
        setDropinKey(prev => prev + 1); // Reset DropIn on error
        dispatch({ type: 'transactions/send/rejected', payload: err.response?.data?.message || 'Payment failed' });
      }
    }
  };

  const handleAddContact = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError(null);
    try {
      await api.post('/auth/register', { 
        ...newContact, 
        password: 'password123' // Default password for added contacts
      });
      setShowModal(false);
      setNewContact({ name: '', email: '' });
      fetchUsers(); // Refresh list
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to add contact');
    } finally {
      setModalLoading(false);
    }
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U';

  return (
    <div className="layout user-portal">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1>💸 Send Money</h1>
          <p>Transfer funds via wallet balance or direct card payment</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '24px', alignItems: 'start' }}>
          <div className="card">
            <h2 className="section-title">Transfer Details</h2>

            {txError && <div className="alert alert-error">⚠️ {txError}</div>}
            {txSuccess && <div className="alert alert-success">✅ {txSuccess}</div>}

            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
              <button 
                className={`btn ${payMethod === 'wallet' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1 }}
                onClick={() => setPayMethod('wallet')}
              >
                💰 Wallet Balance
              </button>
              <button 
                className={`btn ${payMethod === 'card' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1 }}
                onClick={() => setPayMethod('card')}
              >
                💳 Credit Card
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Recipient Email</label>
                <input
                  className="form-control"
                  type="email"
                  name="receiverEmail"
                  placeholder="recipient@example.com"
                  value={form.receiverEmail}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Amount (PKR)</label>
                <input
                  className="form-control"
                  type="number"
                  name="amount"
                  placeholder="0.00"
                  min="1"
                  step="0.01"
                  value={form.amount}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group" style={{ display: payMethod === 'card' ? 'block' : 'none' }}>
                <label>Card Details (Braintree)</label>
                {clientToken ? (
                  <DropIn
                    key={dropinKey}
                    options={{ authorization: clientToken }}
                    onInstance={(instance) => { dropinInstance.current = instance; }}
                  />
                ) : (
                  <div style={{ padding: '10px', color: 'var(--text-secondary)' }}>Loading payment form...</div>
                )}
              </div>

              <div className="form-group">
                <label>Description (optional)</label>
                <input
                  className="form-control"
                  type="text"
                  name="description"
                  placeholder="e.g. Rent, Split bill..."
                  value={form.description}
                  onChange={handleChange}
                />
              </div>

              <button className="btn btn-primary btn-block" type="submit" disabled={txLoading || (payMethod === 'card' && !clientToken)}>
                {txLoading ? <><span className="spinner"></span> Processing...</> : `💸 Send via ${payMethod === 'wallet' ? 'Wallet' : 'Card'}`}
              </button>
            </form>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="card">
              <h2 className="section-title">💰 Your Balance</h2>
              <div style={{ textAlign: 'center', padding: '12px 0' }}>
                <p style={{ fontSize: '32px', fontWeight: 800, color: 'var(--accent)' }}>
                  PKR {parseFloat(balance).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                </p>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>Available Balance</p>
              </div>
            </div>

            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 className="section-title" style={{ marginBottom: 0 }}>👥 Quick Contacts</h2>
                <button 
                  className="btn btn-secondary" 
                  style={{ padding: '4px 10px', fontSize: '12px' }}
                  onClick={() => setShowModal(true)}
                >
                  ➕ Add
                </button>
              </div>
              <input
                className="form-control"
                type="text"
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ marginBottom: '12px' }}
              />
              <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {filteredUsers.map(u => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, receiverEmail: u.email }))}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '10px 12px', borderRadius: 'var(--radius-sm)',
                      background: form.receiverEmail === u.email ? 'var(--accent-light)' : 'var(--bg-primary)',
                      border: `1px solid ${form.receiverEmail === u.email ? 'var(--border-accent)' : 'var(--border)'}`,
                      cursor: 'pointer', textAlign: 'left', width: '100%'
                    }}
                  >
                    <div style={{
                      width: '34px', height: '34px', borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--accent), #14b8a6)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: '13px', color: 'white'
                    }}>
                      {getInitials(u.name)}
                    </div>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>{u.name}</p>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{u.email}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Add Contact Modal */}
        {showModal && (
          <div className="modal-overlay" style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 1000
          }}>
            <div className="card" style={{ width: '400px', maxWidth: '90%' }}>
              <h2 className="section-title">Add New Contact</h2>
              {modalError && <div className="alert alert-error">{modalError}</div>}
              <form onSubmit={handleAddContact}>
                <div className="form-group">
                  <label>Full Name</label>
                  <input 
                    className="form-control" 
                    type="text" 
                    value={newContact.name}
                    onChange={(e) => setNewContact({...newContact, name: e.target.value})}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input 
                    className="form-control" 
                    type="email" 
                    value={newContact.email}
                    onChange={(e) => setNewContact({...newContact, email: e.target.value})}
                    required 
                  />
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  Default password will be <code>password123</code>
                </p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={modalLoading}>
                    {modalLoading ? 'Adding...' : 'Add Contact'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
