import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from '@tanstack/react-table';
import { fetchHistory } from '../features/transactions/transactionSlice';
import Sidebar from '../components/Sidebar';
import Receipt from '../components/Receipt';

const columns = (userId, onOpenReceipt) => [
  {
    header: '#',
    accessorKey: 'id',
    cell: (info) => <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>#{info.getValue()}</span>,
  },
  {
    header: 'Type',
    accessorKey: 'type',
    cell: (info) => {
      const type = info.getValue();
      let cls = 'badge-accent';
      let icon = '➕';
      if (type === 'transfer') { cls = 'badge-warning'; icon = '💸'; }
      if (type === 'withdrawal') { cls = 'badge-danger'; icon = '📤'; }
      return <span className={`badge ${cls}`}>{icon} {type.charAt(0).toUpperCase() + type.slice(1)}</span>;
    },
  },
  {
    header: 'Amount',
    accessorKey: 'amount',
    cell: (info) => {
      const row = info.row.original;
      const uid = userId;
      let cls = 'tx-amount-topup';
      let prefix = '+';
      if (row.type === 'transfer') {
        if (row.senderId === uid) { cls = 'tx-amount-sent'; prefix = '-'; }
        else { cls = 'tx-amount-received'; prefix = '+'; }
      } else if (row.type === 'withdrawal') {
        cls = 'tx-amount-sent'; prefix = '-';
      }
      return <span className={cls}>{prefix} PKR {parseFloat(info.getValue()).toLocaleString()}</span>;
    },
  },
  {
    header: 'Status',
    accessorKey: 'status',
    cell: (info) => {
      const s = info.getValue();
      const cls = s === 'success' ? 'badge-success' : s === 'pending' ? 'badge-warning' : 'badge-danger';
      const isFailed = s === 'failed';
      return (
        <span 
          className={`badge ${cls}`}
          style={isFailed ? { cursor: 'pointer', textDecoration: 'underline' } : {}}
          onClick={() => {
            if (isFailed) {
              alert(`❌ Transaction Failed!\n\nReason: ${info.row.original.description || 'System Error/Network Timeout'}`);
            }
          }}
          title={isFailed ? "Click to view failure reason" : ""}
        >
          {s === 'success' ? '✓ Success' : s === 'pending' ? '⏳ Pending' : '✗ Failed'}
        </span>
      );
    },
  },
  {
    header: 'Receipt',
    id: 'actions',
    cell: (info) => (
      <button 
        className="btn btn-secondary" 
        style={{ padding: '4px 10px', fontSize: '11px', borderRadius: '6px' }}
        onClick={() => onOpenReceipt(info.row.original)}
      >
        📄 View
      </button>
    )
  },
  {
    header: 'Date',
    accessorKey: 'createdAt',
    cell: (info) => {
      const d = new Date(info.getValue());
      return <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{d.toLocaleDateString()} {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>;
    },
  },
];

export default function History() {
  const dispatch = useDispatch();
  const { list, total, totalPages, loading } = useSelector((state) => state.transactions);
  const { user } = useSelector((state) => state.auth);

  const [filters, setFilters] = useState({ search: '', type: '', status: '', sortBy: 'createdAt', order: 'DESC', page: 1, limit: 10 });
  const [selectedTx, setSelectedTx] = useState(null);

  const loadData = useCallback(() => {
    dispatch(fetchHistory(filters));
  }, [dispatch, filters]);

  useEffect(() => { loadData(); }, [loadData]);

  const table = useReactTable({
    data: list,
    columns: columns(user?.id, (tx) => setSelectedTx(tx)),
    getCoreRowModel: getCoreRowModel(),
  });

  const handleFilter = (key, value) => setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  const handleSort = (col) => {
    if (filters.sortBy === col) {
      setFilters((prev) => ({ ...prev, order: prev.order === 'ASC' ? 'DESC' : 'ASC' }));
    } else {
      setFilters((prev) => ({ ...prev, sortBy: col, order: 'DESC' }));
    }
  };

  return (
    <div className="layout user-portal">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1>📜 Transaction History</h1>
          <p>Download receipts for all your credits, debits, and transfers</p>
        </div>

        {/* Filters */}
        <div className="filters-bar">
          <input
            id="history-search"
            className="form-control"
            placeholder="🔍 Search ID or TID..."
            value={filters.search}
            onChange={(e) => handleFilter('search', e.target.value)}
          />
          <select className="form-control" value={filters.type} onChange={(e) => handleFilter('type', e.target.value)}>
            <option value="">All Types</option>
            <option value="topup">Top-up</option>
            <option value="transfer">Transfer</option>
            <option value="withdrawal">Withdrawal</option>
          </select>
          <select className="form-control" value={filters.status} onChange={(e) => handleFilter('status', e.target.value)}>
            <option value="">All Status</option>
            <option value="success">Success</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
          <select className="form-control" value={filters.limit} onChange={(e) => handleFilter('limit', parseInt(e.target.value))}>
            <option value={10}>10 / page</option>
            <option value={20}>20 / page</option>
            <option value={50}>50 / page</option>
          </select>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((h) => (
                    <th key={h.id} onClick={() => ['amount', 'createdAt'].includes(h.column.id) && handleSort(h.column.id)}>
                      {flexRender(h.column.columnDef.header, h.getContext())}
                      {filters.sortBy === h.column.id ? (filters.order === 'ASC' ? ' ▲' : ' ▼') : ''}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading records...</td></tr>
              ) : list.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No transactions found</td></tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div className="pagination">
            <span>Showing {list.length} of {total} transactions</span>
            <div className="pagination-btns">
              <button disabled={filters.page <= 1} onClick={() => setFilters((p) => ({ ...p, page: p.page - 1 }))}>← Prev</button>
              <span style={{ padding: '8px 16px', color: 'var(--text-secondary)' }}>
                Page {filters.page} of {totalPages}
              </span>
              <button disabled={filters.page >= totalPages} onClick={() => setFilters((p) => ({ ...p, page: p.page + 1 }))}>Next →</button>
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
