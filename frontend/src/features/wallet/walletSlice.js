import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../app/api';

export const fetchBalance = createAsyncThunk('wallet/balance', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/wallet/balance');
    return res.data.balance;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch balance');
  }
});

// Request Top-up (Manual)
export const requestTopUp = createAsyncThunk('wallet/requestTopUp', async (data, { rejectWithValue }) => {
  try {
    const res = await api.post('/wallet/request-topup', data);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to submit top-up request');
  }
});

// Request Withdrawal
export const requestWithdrawal = createAsyncThunk('wallet/requestWithdrawal', async (data, { rejectWithValue }) => {
  try {
    const res = await api.post('/wallet/withdraw', data);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to submit withdrawal request');
  }
});

// Fetch Active Payment Methods
export const fetchPaymentMethods = createAsyncThunk('wallet/fetchPaymentMethods', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/payment-methods');
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch payment methods');
  }
});

// Card Top-up via Braintree
export const cardTopUp = createAsyncThunk('wallet/cardTopUp', async ({ nonce, amount }, { rejectWithValue }) => {
  try {
    const res = await api.post('/braintree/pay', { nonce, amount });
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Card payment failed');
  }
});

const walletSlice = createSlice({
  name: 'wallet',
  initialState: {
    balance: 0,
    paymentMethods: [],
    loading: false,
    error: null,
    success: null,
  },
  reducers: {
    clearWalletMessages: (state) => {
      state.error = null;
      state.success = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBalance.pending, (state) => { state.loading = true; })
      .addCase(fetchBalance.fulfilled, (state, action) => { state.loading = false; state.balance = action.payload; })
      .addCase(fetchBalance.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      // Request Top-up
      .addCase(requestTopUp.pending, (state) => { state.loading = true; state.error = null; state.success = null; })
      .addCase(requestTopUp.fulfilled, (state, action) => {
        state.loading = false;
        state.success = action.payload.message;
      })
      .addCase(requestTopUp.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      // Request Withdrawal
      .addCase(requestWithdrawal.pending, (state) => { state.loading = true; state.error = null; state.success = null; })
      .addCase(requestWithdrawal.fulfilled, (state, action) => {
        state.loading = false;
        state.balance = action.payload.balance;
        state.success = action.payload.message;
      })
      .addCase(requestWithdrawal.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      // Fetch Payment Methods
      .addCase(fetchPaymentMethods.pending, (state) => { state.loading = true; })
      .addCase(fetchPaymentMethods.fulfilled, (state, action) => { state.loading = false; state.paymentMethods = action.payload; })
      .addCase(fetchPaymentMethods.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      // Card Top-up via Braintree
      .addCase(cardTopUp.pending, (state) => { state.loading = true; state.error = null; state.success = null; })
      .addCase(cardTopUp.fulfilled, (state, action) => {
        state.loading = false;
        state.balance = action.payload.balance;
        state.success = action.payload.message;
      })
      .addCase(cardTopUp.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
  },
});

export const { clearWalletMessages } = walletSlice.actions;
export default walletSlice.reducer;
