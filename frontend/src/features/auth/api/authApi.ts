import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '../../../services/api/baseApi';
import type {
  ApiResponse,
  AuthUser,
  ForgotPasswordRequest,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
  TokenResponse,
  VerifyOtpRequest,
  VerifyOtpResponse,
} from '../types/auth.types';

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: baseQueryWithReauth,
  endpoints: (builder) => ({
    /**
     * Register: new user registration into DB with default USER role.
     */
    register: builder.mutation<ApiResponse<TokenResponse>, RegisterRequest>({
      query: (userData) => ({
        url: '/auth/register',
        method: 'POST',
        body: userData,
      }),
    }),

    /**
     * Login: email + password → access token (body) + refresh cookie (HttpOnly)
     * NOTE: No role field in request — backend determines role from database.
     */
    login: builder.mutation<ApiResponse<TokenResponse>, LoginRequest>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),

    /**
     * Refresh: uses the HttpOnly refresh cookie → new access token
     */
    refreshToken: builder.mutation<ApiResponse<{ access_token: string; token_type: string }>, void>({
      query: () => ({
        url: '/auth/refresh',
        method: 'POST',
      }),
    }),

    /**
     * Get current user from a valid access token
     */
    getCurrentUser: builder.query<ApiResponse<AuthUser>, void>({
      query: () => '/auth/me',
    }),

    /**
     * Logout: clears HttpOnly refresh cookie server-side
     */
    logout: builder.mutation<ApiResponse<{ message: string }>, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
    }),

    /**
     * Forgot password: send OTP to registered email address.
     * Always returns generic success — never discloses email existence.
     */
    forgotPassword: builder.mutation<ApiResponse<{ message: string }>, ForgotPasswordRequest>({
      query: (body) => ({
        url: '/auth/forgot-password',
        method: 'POST',
        body,
      }),
    }),

    /**
     * Verify OTP: validate 6-digit code and receive a short-lived reset token.
     * The reset token must NOT be persisted in localStorage/sessionStorage.
     */
    verifyOtp: builder.mutation<ApiResponse<VerifyOtpResponse>, VerifyOtpRequest>({
      query: (body) => ({
        url: '/auth/verify-reset-otp',
        method: 'POST',
        body,
      }),
    }),

    /**
     * Reset password: submit reset token + new password to update credentials.
     */
    resetPassword: builder.mutation<ApiResponse<{ message: string }>, ResetPasswordRequest>({
      query: (body) => ({
        url: '/auth/reset-password',
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useRefreshTokenMutation,
  useGetCurrentUserQuery,
  useLogoutMutation,
  useForgotPasswordMutation,
  useVerifyOtpMutation,
  useResetPasswordMutation,
} = authApi;
