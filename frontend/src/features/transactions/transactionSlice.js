import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../app/api';

export const sendMoney = createAsyncThunk('transactions/send', async (data, { rejectWithValue }) => {
  try {
    const res = await api.post('/transactions/send', data);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Transfer failed');
  }
});

export const fetchHistory = createAsyncThunk('transactions/history', async (params, { rejectWithValue }) => {
  try {
    const res = await api.get('/transactions/history', { params });
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch history');
  }
});

export const fetchSummary = createAsyncThunk('transactions/summary', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/transactions/summary');
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch summary');
  }
});

const transactionSlice = createSlice({
  name: 'transactions',
  initialState: {
    list: [],
    total: 0,
    page: 1,
    totalPages: 1,
    summary: null,
    loading: false,
    error: null,
    success: null,
  },
  reducers: {
    clearTxMessages: (state) => {
      state.error = null;
      state.success = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendMoney.pending, (state) => { state.loading = true; state.error = null; state.success = null; })
      .addCase(sendMoney.fulfilled, (state, action) => {
        state.loading = false;
        state.success = `Transfer successful!`;
        // Update balance immediately from response
        if (action.payload?.balance !== undefined) {
          state.newBalance = action.payload.balance;
        }
      })
      .addCase(sendMoney.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchHistory.pending, (state) => { state.loading = true; })
      .addCase(fetchHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.transactions;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(fetchHistory.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchSummary.fulfilled, (state, action) => { state.summary = action.payload; });
  },
});

export const { clearTxMessages } = transactionSlice.actions;
export default transactionSlice.reducer;
