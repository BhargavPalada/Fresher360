import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AuthState, AuthUser } from './types/auth.types';

const initialState: AuthState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: false,
  isInitializing: true, // true until /auth/me check completes on startup
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Set full auth state after successful login or /me restoration
    setCredentials(
      state,
      action: PayloadAction<{ user: AuthUser; accessToken: string }>
    ) {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.isAuthenticated = true;
      state.error = null;
      state.isInitializing = false;
    },

    // Update access token after a silent refresh
    updateAccessToken(state, action: PayloadAction<string>) {
      state.accessToken = action.payload;
    },

    // Clear all auth state (logout or 401 from refresh)
    clearCredentials(state) {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      state.error = null;
      state.isInitializing = false;
    },

    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },

    setError(state, action: PayloadAction<string>) {
      state.error = action.payload;
      state.isLoading = false;
    },

    setInitializing(state, action: PayloadAction<boolean>) {
      state.isInitializing = action.payload;
    },
  },
});

export const {
  setCredentials,
  updateAccessToken,
  clearCredentials,
  setLoading,
  setError,
  setInitializing,
} = authSlice.actions;

export default authSlice.reducer;

// ── Selectors ──────────────────────────────────────────────────────────────
import type { RootState } from '../../app/store';

export const selectCurrentUser = (state: RootState) => state.auth.user;
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;
export const selectAccessToken = (state: RootState) => state.auth.accessToken;
export const selectIsInitializing = (state: RootState) => state.auth.isInitializing;
export const selectAuthError = (state: RootState) => state.auth.error;
export const selectAuthLoading = (state: RootState) => state.auth.isLoading;
