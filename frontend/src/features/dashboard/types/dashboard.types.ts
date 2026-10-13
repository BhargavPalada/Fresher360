import type { Task } from '../../tasks/types/tasks.types';

export interface AdminDashboardStats {
  role: 'ADMIN';
  total_users: number;
  total_freshers: number;
  active_freshers: number;
  total_admins: number;
  total_tasks: number;
  active_tasks: number;
  completed_tasks: number;
  in_progress_tasks: number;
  pending_tasks: number;
  total_assignments: number;
  completed_assignments: number;
  completion_rate: number;
  average_score: number | null;
  passed_count: number;
  pending_evaluations: number;
  category_counts: Record<string, number>;
  priority_counts: Record<string, number>;
  status_counts: Record<string, number>;
  recent_users: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    is_active: boolean;
  }>;
  recent_tasks: Task[];
}

export interface UserDashboardStats {
  role: 'USER';
  total_assigned: number;
  completed_tasks: number;
  in_progress_tasks: number;
  pending_tasks: number;
  in_review_tasks: number;
  completion_rate: number;
  average_score: number | null;
  passed_count: number;
  recent_tasks: Task[];
}

export type DashboardStats = AdminDashboardStats | UserDashboardStats;
