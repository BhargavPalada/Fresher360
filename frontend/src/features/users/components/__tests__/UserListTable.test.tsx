import type { ReactElement } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { UserListTable } from '../UserListTable';
import authReducer from '../../../auth/authSlice';

const mockUsers = [
  {
    id: 'user-1',
    email: 'admin@test.com',
    first_name: 'Admin',
    last_name: 'User',
    role: 'ADMIN',
    is_active: true,
  },
  {
    id: 'user-2',
    email: 'fresher@test.com',
    first_name: 'John',
    last_name: 'Fresher',
    role: 'USER',
    is_active: true,
  },
];

vi.mock('../../api/usersApi', () => ({
  usersApi: {
    reducerPath: 'usersApi',
    reducer: (state = {}) => state,
    middleware: () => (next: (arg: unknown) => unknown) => (action: unknown) => next(action),
  },
  useGetUsersQuery: () => ({
    data: { data: mockUsers, error: null },
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
  useUpdateUserRoleMutation: () => [vi.fn().mockResolvedValue({ data: null }), { isLoading: false }],
  useCreateUserMutation: () => [vi.fn().mockResolvedValue({ data: null }), { isLoading: false }],
}));

function renderWithProviders(ui: ReactElement) {
  const store = configureStore({
    reducer: {
      auth: authReducer,
      usersApi: (state = {}) => state,
    },
  });

  return render(<Provider store={store}>{ui}</Provider>);
}

describe('UserListTable', () => {
  it('renders user list from data', () => {
    renderWithProviders(<UserListTable onAddUser={vi.fn()} />);

    expect(screen.getByText('Admin User')).toBeInTheDocument();
    expect(screen.getByText('admin@test.com')).toBeInTheDocument();
    expect(screen.getByText('John Fresher')).toBeInTheDocument();
    expect(screen.getByText('fresher@test.com')).toBeInTheDocument();
  });

  it('triggers onAddUser when Add User button is clicked', async () => {
    const user = userEvent.setup();
    const handleAddUser = vi.fn();
    renderWithProviders(<UserListTable onAddUser={handleAddUser} />);

    const addBtn = screen.getByRole('button', { name: /add user/i });
    await user.click(addBtn);

    expect(handleAddUser).toHaveBeenCalledTimes(1);
  });

  it('filters users when searching in the search bar', async () => {
    const user = userEvent.setup();
    renderWithProviders(<UserListTable onAddUser={vi.fn()} />);

    const searchInput = screen.getByPlaceholderText(/search by name/i);
    await user.type(searchInput, 'admin');

    expect(screen.getByText('Admin User')).toBeInTheDocument();
    expect(screen.queryByText('John Fresher')).not.toBeInTheDocument();
  });
});
