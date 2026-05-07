import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import DropIn from 'braintree-web-drop-in-react';
import api from '../app/api';
import { requestWithdrawal, fetchBalance, clearWalletMessages } from '../features/wallet/walletSlice';
import Sidebar from '../components/Sidebar';

export default function Withdraw() {
  const dispatch = useDispatch();
  const { balance, loading, error, success } = useSelector((state) => state.wallet);
  
  const [amount, setAmount] = useState('');
  const [clientToken, setClientToken] = useState(null);
  const [tokenError, setTokenError] = useState(null);
  const dropinInstance = useRef(null);

  useEffect(() => {
    dispatch(fetchBalance());
    api.get('/braintree/token')
      .then((res) => setClientToken(res.data.clientToken))
      .catch(() => setTokenError('Could not load payment form.'));
    return () => dispatch(clearWalletMessages());
  }, [dispatch]);

  useEffect(() => {
    if (success) {
      setAmount('');
      setTimeout(() => dispatch(clearWalletMessages()), 6000);
    }
  }, [success, dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!dropinInstance.current || !amount || parseFloat(amount) <= 0) return;

    try {
      const { nonce } = await dropinInstance.current.requestPaymentMethod();
      dispatch(requestWithdrawal({ 
        amount: parseFloat(amount), 
        paymentMethod: 'Card (Braintree)', 
        paymentRef: nonce // Using nonce as ref for now
      }));
    } catch (err) {
      // Handle dropin error
    }
  };

  return (
    <div className="layout user-portal">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1>📤 Withdraw Funds</h1>
          <p>Transfer funds from your wallet back to your card via Braintree</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '24px', alignItems: 'start' }}>
          <div className="card">
            <h2 className="section-title">Withdrawal Details</h2>
            
            {error && <div className="alert alert-error">⚠️ {error}</div>}
            {success && <div className="alert alert-success">✅ {success}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Amount to Withdraw (PKR)</label>
                <input
                  className="form-control"
                  type="number"
                  placeholder="Enter amount..."
                  min="1"
                  max={balance}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Available: PKR {parseFloat(balance).toLocaleString()}
                </p>
              </div>

              <div className="form-group">
                <label>Destination Card</label>
                {tokenError ? (
                  <div className="alert alert-error">{tokenError}</div>
                ) : !clientToken ? (
                  <div style={{ padding: '10px', color: 'var(--text-secondary)' }}>Loading payment form...</div>
                ) : (
                  <DropIn
                    options={{ authorization: clientToken }}
                    onInstance={(instance) => { dropinInstance.current = instance; }}
                  />
                )}
              </div>

              <button className="btn btn-primary btn-block" type="submit" disabled={loading || !clientToken || !amount || parseFloat(amount) > balance}>
                {loading ? <><span className="spinner"></span> Processing...</> : '📤 Request Withdrawal'}
              </button>
            </form>
          </div>

          <div className="card">
            <h2 className="section-title">Withdrawal Info</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', flexShrink: 0 }}>1</div>
                <p style={{ fontSize: '13px' }}>The amount will be deducted from your wallet balance immediately.</p>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', flexShrink: 0 }}>2</div>
                <p style={{ fontSize: '13px' }}>Funds will be credited back to your selected card within **3-5 business days**.</p>
              </div>
            </div>
            
            <div className="alert alert-info" style={{ marginTop: '24px', fontSize: '12px' }}>
              ℹ️ In Sandbox mode, withdrawals are simulated and will be marked as "Pending" until approved by Admin.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
