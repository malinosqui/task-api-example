import type { DataStore } from '../data/dataStore.js';
import type { 
  Task, 
  CreateTaskRequest, 
  UpdateTaskRequest, 
  PartialUpdateTaskRequest,
  TaskFilters,
  TaskSummary 
} from '../types/task.js';
import { logger } from '../lib/logger.js';

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class TaskService {
  constructor(private dataStore: DataStore) {}

  async createTask(taskData: CreateTaskRequest): Promise<Task> {
    this.validateCreateTaskData(taskData);

    const existingTask = await this.dataStore.findByTitle(taskData.title);
    if (existingTask) {
      logger.warn('Tentativa de criar tarefa com título duplicado', { title: taskData.title });
      throw new ConflictError('Uma tarefa com este título já existe');
    }

    const newTaskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'> = {
      title: taskData.title,
      status: taskData.status ?? 'todo',
    };

    if (taskData.description !== undefined) {
      newTaskData.description = taskData.description;
    }

    if (taskData.dueDate !== undefined) {
      newTaskData.dueDate = taskData.dueDate;
    }

    const task = await this.dataStore.create(newTaskData);

    logger.info('Tarefa criada com sucesso', { taskId: task.id, title: task.title });
    return task;
  }

  async getAllTasks(filters?: TaskFilters): Promise<Task[]> {
    const tasks = await this.dataStore.findAll(filters);
    logger.debug('Tarefas recuperadas', { count: tasks.length, filters });
    return tasks;
  }

  async getTaskSummary(): Promise<TaskSummary> {
    const tasks = await this.dataStore.findAll();
    const now = new Date();
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;

    const statusCounts: TaskSummary['statusCounts'] = {
      todo: 0,
      inProgress: 0,
      done: 0,
    };
    let overdue = 0;
    let dueSoon = 0;

    for (const task of tasks) {
      if (task.status === 'todo') {
        statusCounts.todo += 1;
      } else if (task.status === 'in-progress') {
        statusCounts.inProgress += 1;
      } else if (task.status === 'done') {
        statusCounts.done += 1;
      }

      if (task.status !== 'done' && task.dueDate) {
        const dueDate = new Date(task.dueDate);
        if (!Number.isNaN(dueDate.getTime())) {
          const diffMs = dueDate.getTime() - now.getTime();
          if (diffMs < 0) {
            overdue += 1;
          } else if (diffMs <= sevenDaysInMs) {
            dueSoon += 1;
          }
        }
      }
    }

    const summary: TaskSummary = {
      total: tasks.length,
      statusCounts,
      overdue,
      dueSoon,
    };

    logger.debug('Resumo de tarefas calculado', summary);
    return summary;
  }

  async getTaskById(id: string): Promise<Task> {
    const task = await this.dataStore.findById(id);
    if (!task || task.deletedAt) {
      logger.warn('Tarefa não encontrada', { taskId: id });
      throw new NotFoundError('Tarefa não encontrada');
    }

    logger.debug('Tarefa recuperada por ID', { taskId: id });
    return task;
  }

  async updateTask(id: string, taskData: UpdateTaskRequest): Promise<Task> {
    this.validateUpdateTaskData(taskData);

    const existingTask = await this.dataStore.findById(id);
    if (!existingTask || existingTask.deletedAt) {
      logger.warn('Tentativa de atualizar tarefa inexistente', { taskId: id });
      throw new NotFoundError('Tarefa não encontrada');
    }

    if (taskData.title !== existingTask.title) {
      const duplicateTask = await this.dataStore.findByTitle(taskData.title);
      if (duplicateTask && duplicateTask.id !== id) {
        logger.warn('Tentativa de atualizar para título duplicado', { 
          taskId: id, 
          newTitle: taskData.title 
        });
        throw new ConflictError('Uma tarefa com este título já existe');
      }
    }

    const updatedTask = await this.dataStore.update(id, {
      title: taskData.title,
      status: taskData.status,
      ...(taskData.description !== undefined ? { description: taskData.description } : {}),
      ...(taskData.dueDate !== undefined ? { dueDate: taskData.dueDate } : {}),
    });

    if (!updatedTask) {
      throw new NotFoundError('Tarefa não encontrada');
    }

    logger.info('Tarefa atualizada com sucesso', { taskId: id });
    return updatedTask;
  }

  async partialUpdateTask(id: string, taskData: PartialUpdateTaskRequest): Promise<Task> {
    this.validatePartialUpdateTaskData(taskData);

    const existingTask = await this.dataStore.findById(id);
    if (!existingTask || existingTask.deletedAt) {
      logger.warn('Tentativa de atualizar parcialmente tarefa inexistente', { taskId: id });
      throw new NotFoundError('Tarefa não encontrada');
    }

    if (taskData.title && taskData.title !== existingTask.title) {
      const duplicateTask = await this.dataStore.findByTitle(taskData.title);
      if (duplicateTask && duplicateTask.id !== id) {
        logger.warn('Tentativa de atualizar para título duplicado', { 
          taskId: id, 
          newTitle: taskData.title 
        });
        throw new ConflictError('Uma tarefa com este título já existe');
      }
    }

    const updates: Partial<Task> = {};
    if (taskData.title !== undefined) {
      updates.title = taskData.title;
    }
    if (taskData.status !== undefined) {
      updates.status = taskData.status;
    }

    const updatedTask = await this.dataStore.update(id, updates);

    if (!updatedTask) {
      throw new NotFoundError('Tarefa não encontrada');
    }

    logger.info('Tarefa atualizada parcialmente com sucesso', { taskId: id });
    return updatedTask;
  }

  async deleteTask(id: string): Promise<void> {
    const existingTask = await this.dataStore.findById(id);
    if (!existingTask || existingTask.deletedAt) {
      logger.warn('Tentativa de deletar tarefa inexistente', { taskId: id });
      throw new NotFoundError('Tarefa não encontrada');
    }

    const deleted = await this.dataStore.delete(id);
    if (!deleted) {
      throw new NotFoundError('Tarefa não encontrada');
    }

    logger.info('Tarefa deletada com sucesso', { taskId: id });
  }

  private validateCreateTaskData(taskData: CreateTaskRequest): void {
    if (!taskData.title || taskData.title.trim().length === 0) {
      throw new ValidationError('Título é obrigatório');
    }

    if (taskData.title.length > 200) {
      throw new ValidationError('Título deve ter no máximo 200 caracteres');
    }

    if (taskData.description && taskData.description.length > 1000) {
      throw new ValidationError('Descrição deve ter no máximo 1000 caracteres');
    }

    if (taskData.status && !['todo', 'in-progress', 'done'].includes(taskData.status)) {
      throw new ValidationError('Status deve ser: todo, in-progress ou done');
    }

    if (taskData.dueDate && !this.isValidISODate(taskData.dueDate)) {
      throw new ValidationError('Data de vencimento deve estar no formato ISO 8601');
    }
  }

  private validateUpdateTaskData(taskData: UpdateTaskRequest): void {
    if (!taskData.title || taskData.title.trim().length === 0) {
      throw new ValidationError('Título é obrigatório');
    }

    if (taskData.title.length > 200) {
      throw new ValidationError('Título deve ter no máximo 200 caracteres');
    }

    if (taskData.description && taskData.description.length > 1000) {
      throw new ValidationError('Descrição deve ter no máximo 1000 caracteres');
    }

    if (!['todo', 'in-progress', 'done'].includes(taskData.status)) {
      throw new ValidationError('Status deve ser: todo, in-progress ou done');
    }

    if (taskData.dueDate && !this.isValidISODate(taskData.dueDate)) {
      throw new ValidationError('Data de vencimento deve estar no formato ISO 8601');
    }
  }

  private validatePartialUpdateTaskData(taskData: PartialUpdateTaskRequest): void {
    if (Object.keys(taskData).length === 0) {
      throw new ValidationError('Pelo menos um campo deve ser fornecido para atualização');
    }

    if (taskData.title !== undefined) {
      if (!taskData.title || taskData.title.trim().length === 0) {
        throw new ValidationError('Título não pode estar vazio');
      }
      if (taskData.title.length > 200) {
        throw new ValidationError('Título deve ter no máximo 200 caracteres');
      }
    }

    if (taskData.status && !['todo', 'in-progress', 'done'].includes(taskData.status)) {
      throw new ValidationError('Status deve ser: todo, in-progress ou done');
    }
  }

  private isValidISODate(dateString: string): boolean {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime()) && dateString === date.toISOString();
  }
}
