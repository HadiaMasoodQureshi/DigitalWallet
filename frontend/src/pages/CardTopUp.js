import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import DropIn from 'braintree-web-drop-in-react';
import api from '../app/api';
import { cardTopUp, fetchBalance, clearWalletMessages } from '../features/wallet/walletSlice';
import Sidebar from '../components/Sidebar';

const PRESETS = [500, 1000, 2000, 5000];

export default function CardTopUp() {
  const dispatch = useDispatch();
  const { balance, loading, error, success } = useSelector((state) => state.wallet);

  const [clientToken, setClientToken]   = useState(null);
  const [tokenError,  setTokenError]    = useState(null);
  const [amount,      setAmount]        = useState('');
  const [paid,        setPaid]          = useState(null); // receipt data
  const dropinInstance                  = useRef(null);

  // Fetch balance + Braintree client token on mount
  useEffect(() => {
    dispatch(fetchBalance());
    dispatch(clearWalletMessages());

    api.get('/braintree/token')
      .then((res) => setClientToken(res.data.clientToken))
      .catch(() => setTokenError('Could not load payment form. Please try again.'));
  }, [dispatch]);

  // Auto-clear messages after 6 s
  useEffect(() => {
    if (success || error) {
      const t = setTimeout(() => dispatch(clearWalletMessages()), 6000);
      return () => clearTimeout(t);
    }
  }, [success, error, dispatch]);

  const handlePay = async () => {
    if (!dropinInstance.current || !amount || parseFloat(amount) <= 0) return;

    try {
      const { nonce } = await dropinInstance.current.requestPaymentMethod();
      const result = await dispatch(cardTopUp({ nonce, amount: parseFloat(amount) })).unwrap();
      setPaid(result);
      setAmount('');
    } catch {
      // error is already in Redux state
    }
  };

  return (
    <div className="layout user-portal">
      <Sidebar />
      <main className="main-content">

        {/* ── Header ── */}
        <div className="page-header">
          <h1>💳 Card Top-Up</h1>
          <p>Add funds instantly using your credit / debit card via Braintree Sandbox</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start' }}>

          {/* ── Left: Payment Form ── */}
          <div className="card">

            {/* Sandbox notice */}
            <div className="alert" style={{
              background: 'linear-gradient(135deg,rgba(99,102,241,.15),rgba(168,85,247,.15))',
              border: '1px solid rgba(99,102,241,.3)',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '24px',
              fontSize: '13px',
            }}>
              <strong>🧪 Sandbox Mode</strong> — Use test card&nbsp;
              <code style={{ fontWeight: 700 }}>4111 1111 1111 1111</code> with any future expiry & any CVV.
            </div>

            {/* Success receipt */}
            {paid && (
              <div className="alert alert-success" style={{ marginBottom: '20px' }}>
                <p style={{ fontWeight: 700, fontSize: '15px' }}>✅ Payment Successful!</p>
                <p style={{ fontSize: '13px', marginTop: '4px' }}>
                  PKR {parseFloat(paid.transaction?.amount || amount).toLocaleString()} added to your wallet.
                </p>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Braintree Ref: <code>{paid.braintreeId}</code>
                </p>
              </div>
            )}

            {error && <div className="alert alert-error" style={{ marginBottom: '16px' }}>⚠️ {error}</div>}

            {/* Amount picker */}
            <div className="form-group">
              <label>Select Amount (PKR)</label>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                {PRESETS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`btn ${amount === String(p) ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '8px 14px', fontSize: '13px' }}
                    onClick={() => setAmount(String(p))}
                  >
                    {p.toLocaleString()}
                  </button>
                ))}
              </div>
              <input
                className="form-control"
                type="number"
                placeholder="Or enter custom amount..."
                value={amount}
                min="1"
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            {/* Braintree Drop-in UI */}
            <div className="form-group">
              <label>Card Details</label>
              {tokenError ? (
                <div className="alert alert-error">{tokenError}</div>
              ) : !clientToken ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '16px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                  <span className="spinner" style={{ width: '16px', height: '16px' }} />
                  Loading payment form…
                </div>
              ) : (
                <div id="braintree-dropin-container">
                  <DropIn
                    options={{ authorization: clientToken }}
                    onInstance={(instance) => { dropinInstance.current = instance; }}
                  />
                </div>
              )}
            </div>

            <button
              id="card-topup-pay-btn"
              className="btn btn-primary btn-block"
              onClick={handlePay}
              disabled={loading || !clientToken || !amount || parseFloat(amount) <= 0}
            >
              {loading
                ? <><span className="spinner" /> Processing…</>
                : `💳 Pay PKR ${parseFloat(amount || 0).toLocaleString()}`
              }
            </button>
          </div>

          {/* ── Right: Wallet Status ── */}
          <div className="card">
            <h2 className="section-title">💰 Wallet Status</h2>
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Available Balance</p>
              <p style={{ fontSize: '36px', fontWeight: 800, color: 'var(--success)' }}>
                PKR {parseFloat(balance).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
              </p>
            </div>

            {/* Test cards */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', fontSize: '12px' }}>
              <p style={{ fontWeight: 700, marginBottom: '10px', color: 'var(--text-primary)' }}>
                🧪 Sandbox Test Cards
              </p>
              {[
                { label: '✅ Success',   card: '4111 1111 1111 1111' },
                { label: '❌ Declined',  card: '4000 0000 0000 0002' },
                { label: '🔐 3D Secure', card: '4000 0027 6000 3184' },
              ].map(({ label, card }) => (
                <div key={card} style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '8px 0', borderBottom: '1px solid var(--border)',
                  color: 'var(--text-secondary)'
                }}>
                  <span>{label}</span>
                  <code style={{ fontSize: '11px', color: 'var(--accent)' }}>{card}</code>
                </div>
              ))}
              <p style={{ marginTop: '10px', color: 'var(--text-secondary)' }}>
                Any future expiry date • Any 3-digit CVV
              </p>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
