import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../app/api';

export const fetchStats = createAsyncThunk('admin/stats', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/admin/stats');
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch stats');
  }
});

export const fetchPendingTopUps = createAsyncThunk('admin/pendingTopUps', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/admin/pending-topups');
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch pending requests');
  }
});

export const approveTopUp = createAsyncThunk('admin/approveTopUp', async (id, { rejectWithValue, dispatch }) => {
  try {
    const res = await api.post(`/admin/approve-topup/${id}`);
    dispatch(fetchPendingTopUps());
    dispatch(fetchStats());
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Approval failed');
  }
});

export const rejectTopUp = createAsyncThunk('admin/rejectTopUp', async (id, { rejectWithValue, dispatch }) => {
  try {
    const res = await api.post(`/admin/reject-topup/${id}`);
    dispatch(fetchPendingTopUps());
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Rejection failed');
  }
});

export const fetchPendingWithdrawals = createAsyncThunk('admin/pendingWithdrawals', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/admin/pending-withdrawals');
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch withdrawals');
  }
});

export const completeWithdrawal = createAsyncThunk('admin/completeWithdrawal', async (id, { rejectWithValue, dispatch }) => {
  try {
    const res = await api.post(`/admin/complete-withdrawal/${id}`);
    dispatch(fetchPendingWithdrawals());
    dispatch(fetchStats());
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Completion failed');
  }
});

export const cancelWithdrawal = createAsyncThunk('admin/cancelWithdrawal', async (id, { rejectWithValue, dispatch }) => {
  try {
    const res = await api.post(`/admin/cancel-withdrawal/${id}`);
    dispatch(fetchPendingWithdrawals());
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Cancellation failed');
  }
});

export const toggleUserStatus = createAsyncThunk('admin/toggleUserStatus', async (id, { rejectWithValue }) => {
  try {
    const res = await api.patch(`/admin/users/${id}/toggle-status`);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Status toggle failed');
  }
});

export const adjustBalance = createAsyncThunk('admin/adjustBalance', async ({ id, amount, type, reason }, { rejectWithValue }) => {
  try {
    const res = await api.post(`/admin/users/${id}/adjust-balance`, { amount, type, reason });
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Balance adjustment failed');
  }
});

export const refundTransaction = createAsyncThunk('admin/refundTransaction', async (id, { rejectWithValue }) => {
  try {
    const res = await api.post(`/admin/transactions/${id}/refund`);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Refund failed');
  }
});

const adminSlice = createSlice({
  name: 'admin',
  initialState: {
    stats: null,
    pendingTopUps: [],
    pendingWithdrawals: [],
    loading: false,
    error: null,
    success: null,
  },
  reducers: {
    clearAdminMessages: (state) => {
      state.error = null;
      state.success = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStats.pending, (state) => { state.loading = true; })
      .addCase(fetchStats.fulfilled, (state, action) => { state.loading = false; state.stats = action.payload; })
      .addCase(fetchStats.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(fetchPendingTopUps.pending, (state) => { state.loading = true; })
      .addCase(fetchPendingTopUps.fulfilled, (state, action) => { state.loading = false; state.pendingTopUps = action.payload; })
      .addCase(fetchPendingTopUps.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(approveTopUp.pending, (state) => { state.loading = true; })
      .addCase(approveTopUp.fulfilled, (state, action) => { state.loading = false; state.success = action.payload.message; })
      .addCase(approveTopUp.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(rejectTopUp.pending, (state) => { state.loading = true; })
      .addCase(rejectTopUp.fulfilled, (state, action) => { state.loading = false; state.success = action.payload.message; })
      .addCase(rejectTopUp.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      // Withdrawals
      .addCase(fetchPendingWithdrawals.pending, (state) => { state.loading = true; })
      .addCase(fetchPendingWithdrawals.fulfilled, (state, action) => { state.loading = false; state.pendingWithdrawals = action.payload; })
      .addCase(fetchPendingWithdrawals.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(completeWithdrawal.pending, (state) => { state.loading = true; })
      .addCase(completeWithdrawal.fulfilled, (state, action) => { state.loading = false; state.success = action.payload.message; })
      .addCase(completeWithdrawal.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(cancelWithdrawal.fulfilled, (state, action) => { state.loading = false; state.success = action.payload.message; })
      .addCase(cancelWithdrawal.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(toggleUserStatus.fulfilled, (state, action) => { state.loading = false; state.success = action.payload.message; })
      .addCase(adjustBalance.fulfilled, (state, action) => { state.loading = false; state.success = action.payload.message; })
      .addCase(refundTransaction.fulfilled, (state, action) => { state.loading = false; state.success = action.payload.message; });
  },
});

export const { clearAdminMessages } = adminSlice.actions;
export default adminSlice.reducer;
