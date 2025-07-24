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
}

export type TaskStatus = 'todo' | 'in-progress' | 'done'; 