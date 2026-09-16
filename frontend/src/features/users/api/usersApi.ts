import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '../../../services/api/baseApi';
import type { ApiResponse } from '../../auth/types/auth.types';
import type {
  AdminCreateUserPayload,
  AdminUser,
  UpdateUserRolePayload,
} from '../types/users.types';

export const usersApi = createApi({
  reducerPath: 'usersApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Users'],
  endpoints: (builder) => ({
    getUsers: builder.query<ApiResponse<AdminUser[]>, void>({
      query: () => '/users/admin/list',
      providesTags: ['Users'],
    }),
    updateUserRole: builder.mutation<ApiResponse<AdminUser>, UpdateUserRolePayload>({
      query: ({ userId, role }) => ({
        url: `/users/admin/${userId}/role`,
        method: 'PATCH',
        body: { role },
      }),
      invalidatesTags: ['Users'],
    }),
    createUser: builder.mutation<ApiResponse<AdminUser>, AdminCreateUserPayload>({
      query: (payload) => ({
        url: '/users/admin/create',
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: ['Users'],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useUpdateUserRoleMutation,
  useCreateUserMutation,
} = usersApi;
