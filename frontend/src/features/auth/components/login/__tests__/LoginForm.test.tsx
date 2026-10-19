import type { ReactElement } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { LoginForm } from '../LoginForm';
import authReducer from '../../../authSlice';

const mockNavigate = vi.fn();

// Mock useNavigate
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock the authApi
vi.mock('../../../api/authApi', () => ({
  authApi: {
    reducerPath: 'authApi',
    reducer: (state = {}) => state,
    middleware: () => (next: (arg: unknown) => unknown) => (action: unknown) => next(action),
  },
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

describe('LoginForm', () => {
  it('renders email and password fields', () => {
    renderWithProviders(<LoginForm />);
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
  });

  it('renders the Sign In button', () => {
    renderWithProviders(<LoginForm />);
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('does NOT render any role selector', () => {
    renderWithProviders(<LoginForm />);
    // No combobox, no radio, no select for role
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.queryByText(/admin/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/select role/i)).not.toBeInTheDocument();
  });

  it('shows validation error when email is empty', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />);

    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    });
  });

  it('shows validation error for invalid email format', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />);

    await user.type(screen.getByLabelText(/^email$/i), 'notanemail');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/valid email/i)).toBeInTheDocument();
    });
  });

  it('shows validation error when password is empty', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />);

    await user.type(screen.getByLabelText(/^email$/i), 'test@test.com');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });

  it('toggles password visibility', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />);

    const passwordInput = screen.getByLabelText(/^password$/i);
    expect(passwordInput).toHaveAttribute('type', 'password');

    await user.click(screen.getByRole('button', { name: /toggle password/i }));

    expect(passwordInput).toHaveAttribute('type', 'text');
  });

  it('opens register modal when clicking register link', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />);

    const registerLink = screen.getByRole('button', { name: /register here/i });
    expect(registerLink).toBeInTheDocument();

    await user.click(registerLink);

    expect(screen.getByRole('heading', { name: /create an account/i })).toBeInTheDocument();
  });

  it('navigates to forgot password page when clicking forgot password link', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />);

    const forgotLink = screen.getByRole('button', { name: /forgot password\?/i });
    expect(forgotLink).toBeInTheDocument();

    await user.click(forgotLink);

    expect(mockNavigate).toHaveBeenCalledWith('/forgot-password');
  });
});
