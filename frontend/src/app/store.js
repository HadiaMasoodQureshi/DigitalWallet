import { configureStore, combineReducers } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import walletReducer from '../features/wallet/walletSlice';
import transactionReducer from '../features/transactions/transactionSlice';
import adminReducer from '../features/admin/adminSlice';

const appReducer = combineReducers({
  auth: authReducer,
  wallet: walletReducer,
  transactions: transactionReducer,
  admin: adminReducer,
});

// Root reducer: reset ALL state on logout
const rootReducer = (state, action) => {
  if (action.type === 'auth/logout') {
    state = undefined; // clears every slice
  }
  return appReducer(state, action);
};

export const store = configureStore({
  reducer: rootReducer,
});
