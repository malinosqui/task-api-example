export interface Task {
  id: string;
  title: string;
  description?: string | undefined;
  status: 'todo' | 'in-progress' | 'done';
  dueDate?: string | undefined;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string | null;
  status?: 'todo' | 'in-progress' | 'done';
  dueDate?: string | null;
}

export interface UpdateTaskRequest {
  title: string;
  description?: string | null;
  status: 'todo' | 'in-progress' | 'done';
  dueDate?: string | null;
}

export interface PartialUpdateTaskRequest {
  title?: string;
  status?: 'todo' | 'in-progress' | 'done';
  description?: string | null;
  dueDate?: string | null;
}

export interface TaskFilters {
  status?: 'todo' | 'in-progress' | 'done';
  dueDate?: string;
  dueBefore?: string;
  dueAfter?: string;
  search?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'dueDate';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export type TaskStatus = 'todo' | 'in-progress' | 'done';

export type TaskSortField = 'createdAt' | 'updatedAt' | 'dueDate';
export type SortOrder = 'asc' | 'desc';

export interface TaskSummary {
  total: number;
  statusCounts: {
    todo: number;
    inProgress: number;
    done: number;
  };
  overdue: number;
  dueSoon: number;
}
