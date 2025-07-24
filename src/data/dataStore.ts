import type { Task, TaskFilters } from '../types/task.js';

export interface DataStore {
  create(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task>;
  findById(id: string): Promise<Task | null>;
  findAll(filters?: TaskFilters): Promise<Task[]>;
  update(id: string, updates: Partial<Task>): Promise<Task | null>;
  delete(id: string): Promise<boolean>;
  findByTitle(title: string): Promise<Task | null>;
} 