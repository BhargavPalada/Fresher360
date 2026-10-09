export type TaskCategory = 'Documentation' | 'Technical' | 'Training' | 'Functional';
export type TaskPriority = 'Low' | 'Medium' | 'High';
export type TaskStatus = 'Pending' | 'In Progress' | 'Completed';
export type AssessmentStatus = 'Pending' | 'Under Review' | 'Passed' | 'Failed';

export interface AssignedFresher {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  status: string;
  completion_summary?: string;
  document_url?: string;
  comments?: string;
  assessment_status?: string;
  assessment_result?: string;
}

export interface Task {
  id: string;
  code: string;
  title: string;
  description?: string;
  category: TaskCategory;
  priority: TaskPriority;
  due_date?: string;
  status: TaskStatus;
  comments?: string;
  attachment_url?: string;
  assigned_freshers: AssignedFresher[];
  created_at: string;
  updated_at: string;
}

export interface CreateTaskPayload {
  title: string;
  description: string;
  category: TaskCategory;
  priority: TaskPriority;
  due_date: string; // ISO datetime string
  status?: TaskStatus;
  assigned_fresher_ids: string[];
  comments?: string;
  attachment_url?: string;
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  category?: TaskCategory;
  priority?: TaskPriority;
  due_date?: string;
  status?: TaskStatus;
  assigned_fresher_ids?: string[];
  comments?: string;
  attachment_url?: string;
}

export interface UpdateAssignmentPayload {
  status?: TaskStatus;
  comments?: string;
  assessment_status?: string;
  assessment_result?: string;
}

export interface SubmitTaskPayload {
  completion_summary?: string;
  document_url?: string;
  comments?: string;
}
