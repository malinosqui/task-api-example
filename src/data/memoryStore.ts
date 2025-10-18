import { v4 as uuidv4 } from 'uuid';
import type { Task, TaskFilters, TaskSortField, SortOrder } from '../types/task.js';
import type { DataStore } from './dataStore.js';

export class MemoryStore implements DataStore {
  private tasks = new Map<string, Task>();

  async create(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    const now = new Date().toISOString();
    const task: Task = {
      id: uuidv4(),
      ...taskData,
      status: taskData.status ?? 'todo',
      createdAt: now,
      updatedAt: now,
    };

    this.tasks.set(task.id, task);
    return task;
  }

  async findById(id: string): Promise<Task | null> {
    const task = this.tasks.get(id);
    return task ? { ...task } : null;
  }

  async findAll(filters?: TaskFilters): Promise<Task[]> {
    let tasks = Array.from(this.tasks.values())
      .filter(task => !task.deletedAt);

    if (filters?.status) {
      tasks = tasks.filter(task => task.status === filters.status);
    }

    if (filters?.dueDate) {
      tasks = tasks.filter(task => task.dueDate === filters.dueDate);
    }

    if (filters?.search) {
      const normalizedSearch = filters.search.trim().toLowerCase();
      if (normalizedSearch.length > 0) {
        tasks = tasks.filter(task => {
          const titleMatches = task.title.toLowerCase().includes(normalizedSearch);
          const descriptionMatches = task.description
            ? task.description.toLowerCase().includes(normalizedSearch)
            : false;
          return titleMatches || descriptionMatches;
        });
      }
    }

    const sortBy: TaskSortField = filters?.sortBy ?? 'createdAt';
    const sortOrder: SortOrder = filters?.sortOrder ?? 'desc';

    const getFieldValue = (task: Task, field: TaskSortField): string | undefined => {
      if (field === 'createdAt') {
        return task.createdAt;
      }
      if (field === 'updatedAt') {
        return task.updatedAt;
      }
      return task.dueDate;
    };

    tasks = tasks.sort((a, b) => {
      const aValue = getFieldValue(a, sortBy);
      const bValue = getFieldValue(b, sortBy);

      if (!aValue && !bValue) {
        return 0;
      }
      if (!aValue) {
        return 1;
      }
      if (!bValue) {
        return -1;
      }

      if (aValue === bValue) {
        return 0;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      }

      return aValue < bValue ? 1 : -1;
    });

    return tasks.map(task => ({ ...task }));
  }

  async update(id: string, updates: Partial<Task>): Promise<Task | null> {
    const existingTask = this.tasks.get(id);
    if (!existingTask || existingTask.deletedAt) {
      return null;
    }

    const updatedTask: Task = {
      ...existingTask,
      ...updates,
      id: existingTask.id,
      createdAt: existingTask.createdAt,
      updatedAt: new Date().toISOString(),
    };

    this.tasks.set(id, updatedTask);
    return { ...updatedTask };
  }

  async delete(id: string): Promise<boolean> {
    const task = this.tasks.get(id);
    if (!task || task.deletedAt) {
      return false;
    }

    const deletedTask: Task = {
      ...task,
      deletedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.tasks.set(id, deletedTask);
    return true;
  }

  async findByTitle(title: string): Promise<Task | null> {
    for (const task of this.tasks.values()) {
      if (task.title === title && !task.deletedAt) {
        return { ...task };
      }
    }
    return null;
  }

  // Utility method for testing
  async clear(): Promise<void> {
    this.tasks.clear();
  }

  // Utility method for testing
  async getAll(): Promise<Task[]> {
    return Array.from(this.tasks.values()).map(task => ({ ...task }));
  }
}
