import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from '@tanstack/react-table';
import api from '../app/api';
import Sidebar from '../components/Sidebar';
import { fetchStats, fetchPendingTopUps, approveTopUp, rejectTopUp, fetchPendingWithdrawals, completeWithdrawal, cancelWithdrawal, clearAdminMessages, toggleUserStatus, adjustBalance, refundTransaction } from '../features/admin/adminSlice';

const userColumns = (onToggle, onAdjust) => [
  { header: 'ID', accessorKey: 'id', cell: (i) => <span style={{ color: 'var(--text-muted)' }}>#{i.getValue()}</span> },
  { header: 'Name', accessorKey: 'name', cell: (i) => <strong>{i.getValue()}</strong> },
  { header: 'Email', accessorKey: 'email', cell: (i) => <span style={{ color: 'var(--text-secondary)' }}>{i.getValue()}</span> },
  { header: 'Status', accessorKey: 'isActive', cell: (i) => <span className={`badge ${i.getValue() ? 'badge-success' : 'badge-danger'}`}>{i.getValue() ? 'Active' : 'Blocked'}</span> },
  {
    header: 'Balance', accessorKey: 'balance',
    cell: (i) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontWeight: 700 }}>PKR {parseFloat(i.getValue()).toLocaleString()}</span>
        <button className="btn btn-secondary" style={{ padding: '2px 6px', fontSize: '10px' }} onClick={() => onAdjust(i.row.original.id)}>±</button>
      </div>
    )
  },
  {
    header: 'Actions',
    cell: (i) => (
      <button 
        className={`btn ${i.row.original.isActive ? 'btn-logout' : 'btn-success'}`} 
        style={{ padding: '4px 8px', fontSize: '11px', margin: 0 }} 
        onClick={() => onToggle(i.row.original.id)}
      >
        {i.row.original.isActive ? 'Block' : 'Unblock'}
      </button>
    )
  }
];

const txColumns = (onRefund) => [
  { header: 'ID', accessorKey: 'id', cell: (i) => <span style={{ color: 'var(--text-muted)' }}>#{i.getValue()}</span> },
  { header: 'Type', accessorKey: 'type', cell: (i) => <span className="badge badge-warning">{i.getValue()}</span> },
  {
    header: 'Amount', accessorKey: 'amount',
    cell: (i) => <span style={{ fontWeight: 700, color: 'var(--accent)' }}>PKR {parseFloat(i.getValue()).toLocaleString()}</span>
  },
  { header: 'Status', accessorKey: 'status', cell: (i) => <span className={`badge ${i.getValue() === 'success' ? 'badge-success' : 'badge-danger'}`}>{i.getValue()}</span> },
  {
    header: 'Actions',
    cell: (i) => (
      i.row.original.status === 'success' && i.row.original.type !== 'refund' && (
        <button 
          className="btn btn-secondary" 
          style={{ padding: '4px 8px', fontSize: '11px' }} 
          onClick={() => onRefund(i.row.original.id)}
        >
          Refund
        </button>
      )
    )
  },
  {
    header: 'Date', accessorKey: 'createdAt',
    cell: (i) => <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{new Date(i.getValue()).toLocaleDateString()}</span>
  },
];

export default function Admin() {
  const dispatch = useDispatch();
  const { stats, pendingTopUps, pendingWithdrawals, loading, error, success } = useSelector((state) => state.admin);

  const [tab, setTab] = useState('stats');

  const [users, setUsers] = useState([]);
  const [userTotal, setUserTotal] = useState(0);
  const [userPage, setUserPage] = useState(1);
  const [userSearch, setUserSearch] = useState('');
  const [userTotalPages, setUserTotalPages] = useState(1);

  const [txs, setTxs] = useState([]);
  const [txTotal, setTxTotal] = useState(0);
  const [txPage, setTxPage] = useState(1);
  const [txType, setTxType] = useState('');
  const [txStatus, setTxStatus] = useState('');
  const [txTotalPages, setTxTotalPages] = useState(1);

  useEffect(() => {
    dispatch(fetchStats());
    return () => dispatch(clearAdminMessages());
  }, [dispatch]);

  const loadUsers = useCallback(() => {
    api.get('/admin/users', { params: { page: userPage, limit: 10, search: userSearch } })
      .then(r => { setUsers(r.data.users); setUserTotal(r.data.total); setUserTotalPages(r.data.totalPages); })
      .catch(() => {});
  }, [userPage, userSearch]);

  const loadTxs = useCallback(() => {
    api.get('/admin/transactions', { params: { page: txPage, limit: 10, type: txType, status: txStatus } })
      .then(r => { setTxs(r.data.transactions); setTxTotal(r.data.total); setTxTotalPages(r.data.totalPages); })
      .catch(() => {});
  }, [txPage, txType, txStatus]);

  useEffect(() => { if (tab === 'users') loadUsers(); }, [tab, loadUsers]);
  useEffect(() => { if (tab === 'transactions') loadTxs(); }, [tab, loadTxs]);
  useEffect(() => { if (tab === 'payments') dispatch(fetchPendingTopUps()); }, [tab, dispatch]);
  useEffect(() => { if (tab === 'withdrawals') dispatch(fetchPendingWithdrawals()); }, [tab, dispatch]);

  const handleToggleUser = (id) => { if (window.confirm('Toggle user account status?')) dispatch(toggleUserStatus(id)).then(() => loadUsers()); };
  const handleAdjustBalance = (id) => {
    const amount = window.prompt('Enter amount to adjust (e.g. 500):');
    if (!amount) return;
    const type = window.confirm('Click OK to ADD balance, Cancel to SUBTRACT balance.') ? 'add' : 'subtract';
    const reason = window.prompt('Reason for adjustment:');
    dispatch(adjustBalance({ id, amount, type, reason })).then(() => { loadUsers(); dispatch(fetchStats()); });
  };
  const handleRefund = (id) => { if (window.confirm('Refund this transaction and reverse balances?')) dispatch(refundTransaction(id)).then(() => { loadTxs(); dispatch(fetchStats()); }); };

  const userTable = useReactTable({ data: users, columns: userColumns(handleToggleUser, handleAdjustBalance), getCoreRowModel: getCoreRowModel() });
  const txTable = useReactTable({ data: txs, columns: txColumns(handleRefund), getCoreRowModel: getCoreRowModel() });

  const handleApprove = (id) => { if (window.confirm('Approve this payment?')) dispatch(approveTopUp(id)).then(() => { loadTxs(); dispatch(fetchStats()); }); };
  const handleReject = (id) => { if (window.confirm('Reject this payment?')) dispatch(rejectTopUp(id)).then(() => loadTxs()); };
  const handleCompleteWithdrawal = (id) => { if (window.confirm('Mark this withdrawal as completed?')) dispatch(completeWithdrawal(id)).then(() => { loadTxs(); dispatch(fetchStats()); }); };
  const handleCancelWithdrawal = (id) => { if (window.confirm('Cancel and refund this withdrawal?')) dispatch(cancelWithdrawal(id)).then(() => { loadTxs(); dispatch(fetchStats()); }); };

  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1>🛡️ Admin Panel</h1>
          <p>Monitor users and all platform transactions</p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {[
            { id: 'stats', label: 'Stats', icon: '📊' },
            { id: 'payments', label: 'Top-up Requests', icon: '📩' },
            { id: 'withdrawals', label: 'Withdrawal Requests', icon: '📤' },
            { id: 'users', label: 'Users', icon: '👥' },
            { id: 'transactions', label: 'Transactions', icon: '💳' },
          ].map((t) => (
            <button key={t.id} id={`admin-tab-${t.id}`} className={`btn ${tab === t.id ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab(t.id)}>
              {t.icon} {t.label}
              {t.id === 'payments' && pendingTopUps.length > 0 && <span style={{ marginLeft: '8px', background: 'white', color: 'var(--accent)', padding: '2px 6px', borderRadius: '10px', fontSize: '10px' }}>{pendingTopUps.length}</span>}
              {t.id === 'withdrawals' && pendingWithdrawals.length > 0 && <span style={{ marginLeft: '8px', background: 'white', color: 'var(--danger)', padding: '2px 6px', borderRadius: '10px', fontSize: '10px' }}>{pendingWithdrawals.length}</span>}
            </button>
          ))}
        </div>

        {error && <div className="alert alert-error">⚠️ {error}</div>}
        {success && <div className="alert alert-success">✅ {success}</div>}

        {/* Stats Tab */}
        {tab === 'stats' && stats && (
          <div className="grid-4">
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'var(--accent-light)' }}>👥</div>
              <p className="stat-label">Total Users</p>
              <p className="stat-value">{stats.totalUsers}</p>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'var(--success-light)' }}>💳</div>
              <p className="stat-label">Total Transactions</p>
              <p className="stat-value">{stats.totalTransactions}</p>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'var(--warning-light)' }}>💰</div>
              <p className="stat-label">Total Volume</p>
              <p className="stat-value" style={{ fontSize: '20px' }}>PKR {parseFloat(stats.totalVolume).toLocaleString()}</p>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'var(--danger-light)' }}>❌</div>
              <p className="stat-label">Failed Transactions</p>
              <p className="stat-value" style={{ color: 'var(--danger)' }}>{stats.failedTransactions}</p>
            </div>
          </div>
        )}

        {/* Payment Requests (New) */}
        {tab === 'payments' && (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Ref / TID</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingTopUps.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No pending top-ups</td></tr>
                ) : (
                  pendingTopUps.map((p) => (
                    <tr key={p.tx_id}>
                      <td>
                        <strong>{p.u_name}</strong><br/>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{p.u_email}</span>
                      </td>
                      <td style={{ fontWeight: 700 }}>PKR {parseFloat(p.tx_amount).toLocaleString()}</td>
                      <td><span className="badge badge-accent">{p.tx_paymentMethod}</span></td>
                      <td><code>{p.tx_paymentRef}</code></td>
                      <td style={{ fontSize: '12px' }}>{new Date(p.tx_createdAt).toLocaleString()}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button className="btn btn-success" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => handleApprove(p.tx_id)} disabled={loading}>Approve</button>
                          <button className="btn btn-logout" style={{ padding: '6px 12px', fontSize: '12px', margin: 0 }} onClick={() => handleReject(p.tx_id)} disabled={loading}>Reject</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Withdrawal Requests (New) */}
        {tab === 'withdrawals' && (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Amount</th>
                  <th>Target Method & Account</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingWithdrawals.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No pending withdrawals</td></tr>
                ) : (
                  pendingWithdrawals.map((w) => (
                    <tr key={w.tx_id}>
                      <td>
                        <strong>{w.u_name}</strong><br/>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{w.u_email}</span>
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--danger)' }}>PKR {parseFloat(w.tx_amount).toLocaleString()}</td>
                      <td>
                        <span className="badge badge-warning">{w.tx_paymentMethod}</span><br/>
                        <code style={{ fontSize: '13px' }}>{w.tx_paymentRef}</code>
                      </td>
                      <td style={{ fontSize: '12px' }}>{new Date(w.tx_createdAt).toLocaleString()}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => handleCompleteWithdrawal(w.tx_id)} disabled={loading}>Mark Paid</button>
                          <button className="btn btn-logout" style={{ padding: '6px 12px', fontSize: '12px', margin: 0 }} onClick={() => handleCancelWithdrawal(w.tx_id)} disabled={loading}>Cancel/Refund</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Users Tab */}
        {tab === 'users' && (
          <>
            <div className="filters-bar">
              <input id="admin-user-search" className="form-control" placeholder="🔍 Search users..." value={userSearch} onChange={(e) => { setUserSearch(e.target.value); setUserPage(1); }} />
            </div>
            <div className="table-wrapper">
              <table>
                <thead>{userTable.getHeaderGroups().map(hg => <tr key={hg.id}>{hg.headers.map(h => <th key={h.id}>{flexRender(h.column.columnDef.header, h.getContext())}</th>)}</tr>)}</thead>
                <tbody>
                  {users.length === 0 ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No users found</td></tr>
                    : userTable.getRowModel().rows.map(row => <tr key={row.id}>{row.getVisibleCells().map(cell => <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}</tr>)}
                </tbody>
              </table>
              <div className="pagination">
                <span>{userTotal} total users</span>
                <div className="pagination-btns">
                  <button disabled={userPage <= 1} onClick={() => setUserPage(p => p - 1)}>← Prev</button>
                  <span style={{ padding: '8px 16px', color: 'var(--text-secondary)' }}>Page {userPage} of {userTotalPages}</span>
                  <button disabled={userPage >= userTotalPages} onClick={() => setUserPage(p => p + 1)}>Next →</button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Transactions Tab */}
        {tab === 'transactions' && (
          <>
            <div className="filters-bar">
              <select id="admin-tx-type" className="form-control" value={txType} onChange={(e) => { setTxType(e.target.value); setTxPage(1); }}>
                <option value="">All Types</option>
                <option value="topup">Top-up</option>
                <option value="transfer">Transfer</option>
              </select>
              <select id="admin-tx-status" className="form-control" value={txStatus} onChange={(e) => { setTxStatus(e.target.value); setTxPage(1); }}>
                <option value="">All Status</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>{txTable.getHeaderGroups().map(hg => <tr key={hg.id}>{hg.headers.map(h => <th key={h.id}>{flexRender(h.column.columnDef.header, h.getContext())}</th>)}</tr>)}</thead>
                <tbody>
                  {txs.length === 0 ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No transactions found</td></tr>
                    : txTable.getRowModel().rows.map(row => <tr key={row.id}>{row.getVisibleCells().map(cell => <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}</tr>)}
                </tbody>
              </table>
              <div className="pagination">
                <span>{txTotal} total transactions</span>
                <div className="pagination-btns">
                  <button disabled={txPage <= 1} onClick={() => setTxPage(p => p - 1)}>← Prev</button>
                  <span style={{ padding: '8px 16px', color: 'var(--text-secondary)' }}>Page {txPage} of {txTotalPages}</span>
                  <button disabled={txPage >= txTotalPages} onClick={() => setTxPage(p => p + 1)}>Next →</button>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
