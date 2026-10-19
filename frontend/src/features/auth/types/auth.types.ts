// Auth TypeScript types — these mirror the backend response shapes.
// Passwords and hashes are NEVER present in these types.

export type UserRole = 'ADMIN' | 'USER';

export interface AuthUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
  // NOTE: No 'role' field — backend determines role from database
}

export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: AuthUser;
}

export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
}

export interface ApiError {
  code: string;
  message: string;
}

export interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitializing: boolean;
  error: string | null;
}

// ── Forgot-password flow types ───────────────────────────────────────────────

export interface ForgotPasswordRequest {
  email: string;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

export interface VerifyOtpResponse {
  reset_token: string;
}

export interface ResetPasswordRequest {
  reset_token: string;
  new_password: string;
  confirm_password: string;
}
