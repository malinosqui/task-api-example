import { v4 as uuidv4 } from 'uuid';
import type { Task, TaskFilters } from '../types/task.js';
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
