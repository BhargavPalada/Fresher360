import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '../../../services/api/baseApi';
import type { ApiResponse } from '../../auth/types/auth.types';
import type {
  Task,
  CreateTaskPayload,
  UpdateTaskPayload,
  SubmitTaskPayload,
  UpdateAssignmentPayload,
} from '../types/tasks.types';

export interface TaskFilterParams {
  search?: string;
  status?: string;
  category?: string;
  priority?: string;
  fresher_id?: string;
}

export const tasksApi = createApi({
  reducerPath: 'tasksApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Tasks'],
  endpoints: (builder) => ({
    getTasks: builder.query<ApiResponse<Task[]>, TaskFilterParams | void>({
      query: (params) => {
        if (!params) return '/tasks';
        const searchParams = new URLSearchParams();
        if (params.search) searchParams.append('search', params.search);
        if (params.status) searchParams.append('status', params.status);
        if (params.category) searchParams.append('category', params.category);
        if (params.priority) searchParams.append('priority', params.priority);
        if (params.fresher_id) searchParams.append('fresher_id', params.fresher_id);
        const qs = searchParams.toString();
        return qs ? `/tasks?${qs}` : '/tasks';
      },
      providesTags: ['Tasks'],
    }),
    createTask: builder.mutation<ApiResponse<Task>, CreateTaskPayload>({
      query: (payload) => ({
        url: '/tasks',
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: ['Tasks'],
    }),
    updateTask: builder.mutation<ApiResponse<Task>, { id: string; payload: UpdateTaskPayload }>({
      query: ({ id, payload }) => ({
        url: `/tasks/${id}`,
        method: 'PUT',
        body: payload,
      }),
      invalidatesTags: ['Tasks'],
    }),
    deleteTask: builder.mutation<ApiResponse<{ message: string }>, string>({
      query: (id) => ({
        url: `/tasks/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Tasks'],
    }),
    deleteTaskComments: builder.mutation<ApiResponse<Task>, string>({
      query: (taskId) => ({
        url: `/tasks/${taskId}/comments`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Tasks'],
    }),
    updateAssignment: builder.mutation<
      ApiResponse<Task>,
      { taskId: string; userId: string; payload: UpdateAssignmentPayload }
    >({
      query: ({ taskId, userId, payload }) => ({
        url: `/tasks/${taskId}/assignments/${userId}`,
        method: 'PATCH',
        body: payload,
      }),
      invalidatesTags: ['Tasks'],
    }),
    deleteAssignmentComments: builder.mutation<
      ApiResponse<Task>,
      { taskId: string; userId: string }
    >({
      query: ({ taskId, userId }) => ({
        url: `/tasks/${taskId}/assignments/${userId}/comments`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Tasks'],
    }),
    submitTask: builder.mutation<ApiResponse<Task>, { id: string; payload: SubmitTaskPayload }>({
      query: ({ id, payload }) => ({
        url: `/tasks/${id}/submit`,
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: ['Tasks'],
    }),
    uploadFile: builder.mutation<{ data: { url: string } }, FormData>({
      query: (formData) => ({
        url: '/uploads',
        method: 'POST',
        body: formData,
      }),
    }),
  }),
});

export const {
  useGetTasksQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useDeleteTaskCommentsMutation,
  useUpdateAssignmentMutation,
  useDeleteAssignmentCommentsMutation,
  useSubmitTaskMutation,
  useUploadFileMutation,
} = tasksApi;
