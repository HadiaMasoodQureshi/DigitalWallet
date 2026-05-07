import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPaymentMethods } from '../features/wallet/walletSlice';
import api from '../app/api';
import Sidebar from '../components/Sidebar';

export default function AdminSettings() {
  const dispatch = useDispatch();
  const { paymentMethods, loading: walletLoading } = useSelector((state) => state.wallet);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const [form, setForm] = useState({ provider: 'Braintree', accountName: '', accountNumber: '' });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    dispatch(fetchPaymentMethods());
  }, [dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      if (editingId) {
        await api.put(`/payment-methods/${editingId}`, form);
        setSuccess('Payment method updated successfully');
      } else {
        await api.post('/payment-methods', form);
        setSuccess('New payment method added');
      }
      setForm({ provider: 'Braintree', accountName: '', accountNumber: '' });
      setEditingId(null);
      dispatch(fetchPaymentMethods());
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (m) => {
    setForm({ provider: m.provider, accountName: m.accountName, accountNumber: m.accountNumber });
    setEditingId(m.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this payment method?')) return;
    setLoading(true);
    try {
      await api.delete(`/payment-methods/${id}`);
      setSuccess('Deleted successfully');
      dispatch(fetchPaymentMethods());
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1>⚙️ Admin Settings</h1>
          <p>Manage payment methods and platform configurations</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '24px', alignItems: 'start' }}>
          <div className="card">
            <h2 className="section-title">Methods List</h2>
            {walletLoading && <p>Loading methods...</p>}
            
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Provider</th>
                    <th>Account Name</th>
                    <th>Account Number</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentMethods.map((m) => (
                    <tr key={m.id}>
                      <td>
                        <span className={`badge ${m.provider === 'Braintree' ? 'badge-info' : 'badge-secondary'}`}>
                          {m.provider}
                        </span>
                      </td>
                      <td>{m.accountName}</td>
                      <td>{m.accountNumber}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => handleEdit(m)}>✏️ Edit</button>
                          <button className="btn btn-logout" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => handleDelete(m.id)}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {paymentMethods.length === 0 && (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        No payment methods found. Add one on the right.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <h2 className="section-title">{editingId ? '✏️ Edit Method' : '➕ Add New Method'}</h2>
            
            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Provider</label>
                <div className="form-control" style={{ background: 'rgba(99,102,241,0.07)', color: '#6366f1', fontWeight: 700, cursor: 'default' }}>
                  🔵 Braintree
                </div>
              </div>

              <div className="form-group">
                <label>Account Name</label>
                <input
                  className="form-control"
                  type="text"
                  placeholder="e.g. John Doe"
                  value={form.accountName}
                  onChange={(e) => setForm({ ...form, accountName: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Account Number</label>
                <input
                  className="form-control"
                  type="text"
                  placeholder="e.g. 03451234567"
                  value={form.accountNumber}
                  onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn btn-primary" type="submit" style={{ flex: 1 }} disabled={loading}>
                  {loading ? 'Processing...' : editingId ? 'Update' : 'Add Method'}
                </button>
                {editingId && (
                  <button className="btn btn-secondary" type="button" onClick={() => { setEditingId(null); setForm({ provider: 'Braintree', accountName: '', accountNumber: '' }); }}>
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
