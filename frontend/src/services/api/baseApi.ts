import {
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
  fetchBaseQuery,
} from '@reduxjs/toolkit/query';
import { clearCredentials, selectAccessToken, updateAccessToken } from '../../features/auth/authSlice';
import type { RootState } from '../../app/store';
import type { ApiResponse } from '../../features/auth/types/auth.types';
const rawApiUrl = import.meta.env.VITE_API_BASE_URL;
const BASE_URL = rawApiUrl && rawApiUrl.trim() !== ''
  ? rawApiUrl.trim().replace(/\/+$/, '')
  : 'http://localhost:8000';

/**
 * Raw base query — attaches Bearer token from Redux state.
 * Access token lives only in Redux memory, never localStorage.
 */
const rawBaseQuery = fetchBaseQuery({
  baseUrl: `${BASE_URL}/api/v1`,
  credentials: 'include', // Required to send/receive the HttpOnly refresh cookie
  prepareHeaders: (headers, { getState }) => {
    const token = selectAccessToken(getState() as RootState);
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

/**
 * baseQueryWithReauth — wraps rawBaseQuery with automatic token refresh.
 *
 * Flow on 401:
 *  1. Attempt POST /auth/refresh (sends HttpOnly cookie automatically)
 *  2. On success: update Redux access token, retry original request
 *  3. On failure: clear Redux state (redirect handled by ProtectedRoute)
 */
export const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status === 401) {
    // Attempt silent refresh
    const refreshResult = await rawBaseQuery(
      { url: '/auth/refresh', method: 'POST' },
      api,
      extraOptions
    );

    if (refreshResult.data) {
      const response = refreshResult.data as ApiResponse<{ access_token: string }>;
      if (response.data?.access_token) {
        api.dispatch(updateAccessToken(response.data.access_token));
        // Retry the original request with the new token
        result = await rawBaseQuery(args, api, extraOptions);
      } else {
        api.dispatch(clearCredentials());
      }
    } else {
      // Refresh failed — session expired, force logout
      api.dispatch(clearCredentials());
    }
  }

  return result;
};
