export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'done';
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  status?: 'todo' | 'in-progress' | 'done';
  dueDate?: string;
}

export interface UpdateTaskRequest {
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'done';
  dueDate?: string;
}

export interface PartialUpdateTaskRequest {
  title?: string;
  status?: 'todo' | 'in-progress' | 'done';
}

export interface TaskFilters {
  status?: 'todo' | 'in-progress' | 'done';
  dueDate?: string;
  search?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'dueDate';
  sortOrder?: 'asc' | 'desc';
}

export type TaskStatus = 'todo' | 'in-progress' | 'done';

export type TaskSortField = 'createdAt' | 'updatedAt' | 'dueDate';
export type SortOrder = 'asc' | 'desc';
