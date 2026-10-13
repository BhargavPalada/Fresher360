import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  clearCredentials,
  selectAccessToken,
  selectAuthError,
  selectAuthLoading,
  selectCurrentUser,
  selectIsAuthenticated,
  selectIsInitializing,
  setCredentials,
} from '../authSlice';
import { useLoginMutation, useLogoutMutation, useRegisterMutation, authApi } from '../api/authApi';
import type { LoginRequest, RegisterRequest } from '../types/auth.types';
import type { AppDispatch } from '../../../app/store';

export function useAuth() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const user = useSelector(selectCurrentUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isInitializing = useSelector(selectIsInitializing);
  const isLoading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);
  const accessToken = useSelector(selectAccessToken);

  const [loginMutation, { isLoading: isLoginLoading }] = useLoginMutation();
  const [registerMutation, { isLoading: isRegisterLoading }] = useRegisterMutation();
  const [logoutMutation] = useLogoutMutation();

  const register = async (userData: RegisterRequest) => {
    const result = await registerMutation(userData).unwrap();

    if (result.data) {
      dispatch(
        setCredentials({
          user: result.data.user,
          accessToken: result.data.access_token,
        })
      );

      navigate('/user', { replace: true });
    }
  };

  const login = async (credentials: LoginRequest) => {
    const result = await loginMutation(credentials).unwrap();

    if (result.data) {
      dispatch(
        setCredentials({
          user: result.data.user,
          accessToken: result.data.access_token,
        })
      );

      // Role-based navigation — determined by backend, not by user
      if (result.data.user.role === 'ADMIN') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/user', { replace: true });
      }
    }
  };

  const logout = async () => {
    try {
      await logoutMutation().unwrap();
    } catch {
      // Even if server logout fails, clear local state
    } finally {
      dispatch(clearCredentials());
      dispatch(authApi.util.resetApiState());
      navigate('/login', { replace: true });
    }
  };

  return {
    user,
    isAuthenticated,
    isInitializing,
    isLoading: isLoading || isLoginLoading || isRegisterLoading,
    error,
    accessToken,
    login,
    register,
    logout,
  };
}
