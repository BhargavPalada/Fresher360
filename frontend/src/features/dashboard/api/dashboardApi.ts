import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '../../../services/api/baseApi';
import type { ApiResponse } from '../../auth/types/auth.types';
import type { AdminDashboardStats, UserDashboardStats } from '../types/dashboard.types';

export const dashboardApi = createApi({
  reducerPath: 'dashboardApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Dashboard'],
  endpoints: (builder) => ({
    getAdminDashboardStats: builder.query<ApiResponse<AdminDashboardStats>, void>({
      query: () => '/dashboard/stats',
      providesTags: ['Dashboard'],
    }),
    getUserDashboardStats: builder.query<ApiResponse<UserDashboardStats>, void>({
      query: () => '/dashboard/stats',
      providesTags: ['Dashboard'],
    }),
  }),
});

export const {
  useGetAdminDashboardStatsQuery,
  useGetUserDashboardStatsQuery,
} = dashboardApi;
