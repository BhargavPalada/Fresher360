import type { ReactElement } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../authSlice';
import ForgotPasswordPage from '../../../pages/ForgotPasswordPage';
import VerifyOtpPage from '../../../pages/VerifyOtpPage';
import ResetPasswordPage from '../../../pages/ResetPasswordPage';

// Shared mock navigation
const mockNavigate = vi.fn();
let mockLocationState: Record<string, unknown> | null = null;

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({
      state: mockLocationState,
      pathname: '/',
      search: '',
      hash: '',
      key: 'default',
    }),
  };
});

// Mock authApi hooks
const mockForgotPassword = vi.fn();
const mockVerifyOtp = vi.fn();
const mockResetPassword = vi.fn();

vi.mock('../api/authApi', () => ({
  authApi: {
    reducerPath: 'authApi',
    reducer: (state = {}) => state,
    middleware: () => (next: (arg: unknown) => unknown) => (action: unknown) => next(action),
  },
  useForgotPasswordMutation: () => [mockForgotPassword, { isLoading: false }],
  useVerifyOtpMutation: () => [mockVerifyOtp, { isLoading: false }],
  useResetPasswordMutation: () => [mockResetPassword, { isLoading: false }],
  useLoginMutation: () => [vi.fn().mockResolvedValue({ data: null }), { isLoading: false }],
  useRegisterMutation: () => [vi.fn().mockResolvedValue({ data: null }), { isLoading: false }],
  useLogoutMutation: () => [vi.fn(), {}],
  useGetCurrentUserQuery: () => ({ data: null, error: null, isLoading: false }),
}));

function renderWithProviders(ui: ReactElement) {
  const store = configureStore({
    reducer: {
      auth: authReducer,
      authApi: (state = {}) => state,
    },
  });

  return render(
    <Provider store={store}>
      <MemoryRouter>
        {ui}
      </MemoryRouter>
    </Provider>
  );
}

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocationState = null;
  });

  it('renders email input and submit button', () => {
    renderWithProviders(<ForgotPasswordPage />);
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send verification code/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /back to sign in/i })).toBeInTheDocument();
  });

  it('validates empty email', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ForgotPasswordPage />);

    await user.click(screen.getByRole('button', { name: /send verification code/i }));
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    });
    expect(mockForgotPassword).not.toHaveBeenCalled();
  });

  it('validates invalid email format', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ForgotPasswordPage />);

    await user.type(screen.getByLabelText(/email address/i), 'not-an-email');
    await user.click(screen.getByRole('button', { name: /send verification code/i }));
    await waitFor(() => {
      expect(screen.getByText(/valid email address/i)).toBeInTheDocument();
    });
    expect(mockForgotPassword).not.toHaveBeenCalled();
  });

  it('submits valid email and navigates to verify screen on confirmation', async () => {
    const user = userEvent.setup();
    mockForgotPassword.mockReturnValue({
      unwrap: vi.fn().mockResolvedValue({ success: true, data: { message: 'OTP sent' } }),
    });

    renderWithProviders(<ForgotPasswordPage />);
    await user.type(screen.getByLabelText(/email address/i), 'student@fresher360.com');
    await user.click(screen.getByRole('button', { name: /send verification code/i }));

    await waitFor(() => {
      expect(screen.getByText(/check your inbox/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/student@fresher360\.com/i)).toBeInTheDocument();

    // Click "Enter Verification Code"
    await user.click(screen.getByRole('button', { name: /enter verification code/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/reset-password/verify', {
      state: { email: 'student@fresher360.com' },
    });
  });

  it('shows error banner when API call fails', async () => {
    const user = userEvent.setup();
    mockForgotPassword.mockReturnValue({
      unwrap: vi.fn().mockRejectedValue(new Error('Network error')),
    });

    renderWithProviders(<ForgotPasswordPage />);
    await user.type(screen.getByLabelText(/email address/i), 'student@fresher360.com');
    await user.click(screen.getByRole('button', { name: /send verification code/i }));

    await waitFor(() => {
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });
  });

  it('navigates back to /login when clicking Back to Sign In', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ForgotPasswordPage />);

    await user.click(screen.getByRole('button', { name: /back to sign in/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });
});

describe('VerifyOtpPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders guard message if no email is in location state', () => {
    mockLocationState = null;
    renderWithProviders(<VerifyOtpPage />);

    expect(screen.getByText(/no email provided/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /go to forgot password/i })).toBeInTheDocument();
  });

  it('renders OTP input and resend timer when email is in state', () => {
    mockLocationState = { email: 'student@fresher360.com' };
    renderWithProviders(<VerifyOtpPage />);

    expect(screen.getByText(/enter verification code/i)).toBeInTheDocument();
    expect(screen.getByText(/student@fresher360\.com/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/verification code/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /verify code/i })).toBeInTheDocument();
  });

  it('validates OTP length and format', async () => {
    const user = userEvent.setup();
    mockLocationState = { email: 'student@fresher360.com' };
    renderWithProviders(<VerifyOtpPage />);

    await user.type(screen.getByLabelText(/verification code/i), '123');
    await user.click(screen.getByRole('button', { name: /verify code/i }));

    await waitFor(() => {
      expect(screen.getByText(/code must be exactly 6 digits/i)).toBeInTheDocument();
    });
    expect(mockVerifyOtp).not.toHaveBeenCalled();
  });

  it('calls verifyOtp and navigates to reset password page with reset_token', async () => {
    const user = userEvent.setup();
    mockLocationState = { email: 'student@fresher360.com' };
    mockVerifyOtp.mockReturnValue({
      unwrap: vi.fn().mockResolvedValue({
        success: true,
        data: { reset_token: 'mock-authorization-token-xyz' },
      }),
    });

    renderWithProviders(<VerifyOtpPage />);
    await user.type(screen.getByLabelText(/verification code/i), '654321');
    await user.click(screen.getByRole('button', { name: /verify code/i }));

    await waitFor(() => {
      expect(mockVerifyOtp).toHaveBeenCalledWith({
        email: 'student@fresher360.com',
        otp: '654321',
      });
    });

    expect(mockNavigate).toHaveBeenCalledWith('/reset-password/new', {
      state: { reset_token: 'mock-authorization-token-xyz' },
      replace: true,
    });
  });

  it('displays error when OTP is expired', async () => {
    const user = userEvent.setup();
    mockLocationState = { email: 'student@fresher360.com' };
    mockVerifyOtp.mockReturnValue({
      unwrap: vi.fn().mockRejectedValue({
        data: { detail: { code: 'OTP_EXPIRED', message: 'OTP has expired' } },
      }),
    });

    renderWithProviders(<VerifyOtpPage />);
    await user.type(screen.getByLabelText(/verification code/i), '654321');
    await user.click(screen.getByRole('button', { name: /verify code/i }));

    await waitFor(() => {
      expect(screen.getByText(/your code has expired/i)).toBeInTheDocument();
    });
  });

  it('displays error when max OTP attempts exceeded', async () => {
    const user = userEvent.setup();
    mockLocationState = { email: 'student@fresher360.com' };
    mockVerifyOtp.mockReturnValue({
      unwrap: vi.fn().mockRejectedValue({
        data: { detail: { code: 'OTP_MAX_ATTEMPTS', message: 'Max attempts exceeded' } },
      }),
    });

    renderWithProviders(<VerifyOtpPage />);
    await user.type(screen.getByLabelText(/verification code/i), '654321');
    await user.click(screen.getByRole('button', { name: /verify code/i }));

    await waitFor(() => {
      expect(screen.getByText(/too many incorrect attempts/i)).toBeInTheDocument();
    });
  });
});

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders guard message if no reset_token in state', () => {
    mockLocationState = null;
    renderWithProviders(<ResetPasswordPage />);

    expect(screen.getByText(/reset session expired or invalid/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /restart/i })).toBeInTheDocument();
  });

  it('renders new password and confirm password inputs when token is provided', () => {
    mockLocationState = { reset_token: 'valid-reset-token-123' };
    renderWithProviders(<ResetPasswordPage />);

    expect(screen.getByLabelText(/^new password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^confirm password$/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reset password/i })).toBeInTheDocument();
  });

  it('validates password complexity', async () => {
    const user = userEvent.setup();
    mockLocationState = { reset_token: 'valid-reset-token-123' };
    renderWithProviders(<ResetPasswordPage />);

    // Simple weak password
    await user.type(screen.getByLabelText(/^new password$/i), 'short');
    await user.type(screen.getByLabelText(/^confirm password$/i), 'short');
    await user.click(screen.getByRole('button', { name: /reset password/i }));

    await waitFor(() => {
      expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
    });
    expect(mockResetPassword).not.toHaveBeenCalled();
  });

  it('validates password confirmation matching', async () => {
    const user = userEvent.setup();
    mockLocationState = { reset_token: 'valid-reset-token-123' };
    renderWithProviders(<ResetPasswordPage />);

    await user.type(screen.getByLabelText(/^new password$/i), 'ValidPass123!');
    await user.type(screen.getByLabelText(/^confirm password$/i), 'DifferentPass123!');
    await user.click(screen.getByRole('button', { name: /reset password/i }));

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
    expect(mockResetPassword).not.toHaveBeenCalled();
  });

  it('submits valid new password and shows success confirmation screen', async () => {
    const user = userEvent.setup();
    mockLocationState = { reset_token: 'valid-reset-token-123' };
    mockResetPassword.mockReturnValue({
      unwrap: vi.fn().mockResolvedValue({
        success: true,
        data: { message: 'Password has been reset successfully' },
      }),
    });

    renderWithProviders(<ResetPasswordPage />);
    await user.type(screen.getByLabelText(/^new password$/i), 'StrongP@ssw0rd!');
    await user.type(screen.getByLabelText(/^confirm password$/i), 'StrongP@ssw0rd!');
    await user.click(screen.getByRole('button', { name: /reset password/i }));

    await waitFor(() => {
      expect(screen.getByText(/password reset!/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/your password has been updated successfully/i)).toBeInTheDocument();

    // Click Sign In on success card
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
  });

  it('handles expired reset token error from API', async () => {
    const user = userEvent.setup();
    mockLocationState = { reset_token: 'expired-token' };
    mockResetPassword.mockReturnValue({
      unwrap: vi.fn().mockRejectedValue({
        data: { detail: { code: 'RESET_TOKEN_EXPIRED', message: 'Token expired' } },
      }),
    });

    renderWithProviders(<ResetPasswordPage />);
    await user.type(screen.getByLabelText(/^new password$/i), 'StrongP@ssw0rd!');
    await user.type(screen.getByLabelText(/^confirm password$/i), 'StrongP@ssw0rd!');
    await user.click(screen.getByRole('button', { name: /reset password/i }));

    await waitFor(() => {
      expect(screen.getByText(/your reset session has expired/i)).toBeInTheDocument();
    });
  });
});
