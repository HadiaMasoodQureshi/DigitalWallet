import React from 'react';

export default function Receipt({ transaction, onClose }) {
  if (!transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  const isSent = transaction.type === 'transfer' && transaction.senderId;
  const isReceived = transaction.type === 'transfer' && !transaction.senderId;
  const isTopup = transaction.type === 'topup';
  const isWithdrawal = transaction.type === 'withdrawal';

  return (
    <div className="receipt-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 1000, padding: '20px'
    }}>
      <div className="receipt-content card" style={{
        width: '100%', maxWidth: '400px', padding: '32px',
        background: 'white', position: 'relative', border: '1px dashed #ccc'
      }}>
        <button onClick={onClose} style={{
          position: 'absolute', top: '16px', right: '16px',
          border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer'
        }}>✕</button>

        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '60px', height: '60px', borderRadius: '50%',
            background: 'var(--accent-light)', color: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '30px', margin: '0 auto 12px'
          }}>
            {isTopup ? '📥' : isWithdrawal ? '📤' : '💸'}
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 800 }}>Transaction Receipt</h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Digital Wallet - Official Confirmation</p>
        </div>

        <div style={{ borderTop: '1px dashed var(--border)', borderBottom: '1px dashed var(--border)', padding: '20px 0', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Transaction ID</span>
            <span style={{ fontWeight: 600, fontSize: '13px' }}>#{transaction.id}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Date & Time</span>
            <span style={{ fontWeight: 600, fontSize: '13px' }}>{new Date(transaction.createdAt).toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Type</span>
            <span className="badge badge-accent" style={{ fontSize: '11px' }}>{transaction.type.toUpperCase()}</span>
          </div>
          {(isTopup || isWithdrawal) && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Method</span>
              <span style={{ fontWeight: 600, fontSize: '13px' }}>{transaction.paymentMethod}</span>
            </div>
          )}
          {transaction.paymentRef && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Reference</span>
              <span style={{ fontWeight: 600, fontSize: '13px', fontStyle: 'italic' }}>{transaction.paymentRef}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
            <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>Total Amount</span>
            <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent)' }}>
              PKR {parseFloat(transaction.amount).toLocaleString()}
            </span>
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '20px' }}>
            This is a computer-generated receipt and does not require a physical signature.
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-primary btn-block" onClick={handlePrint}>🖨️ Print Receipt</button>
            <button className="btn btn-secondary btn-block" onClick={onClose}>Close</button>
          </div>
        </div>

        <div style={{ 
          marginTop: '32px', textAlign: 'center', 
          borderTop: '1px solid var(--border)', paddingTop: '16px'
        }}>
           <h3 style={{ fontSize: '14px', color: 'var(--accent)', fontWeight: 800 }}>Digital Wallet App</h3>
           <p style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Secure • Fast • Real</p>
        </div>
      </div>
      <style>{`
        @media print {
          .btn, .sidebar, .page-header, button { display: none !important; }
          .receipt-overlay { background: white !important; position: static !important; }
          .receipt-content { border: none !important; box-shadow: none !important; max-width: 100% !important; }
        }
      `}</style>
    </div>
  );
}
