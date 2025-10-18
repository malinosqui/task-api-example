import { Router, type Request, type Response } from 'express';
import { TaskService, ConflictError, NotFoundError, ValidationError } from '../services/taskService.js';
import type { CreateTaskRequest, UpdateTaskRequest, PartialUpdateTaskRequest, TaskFilters } from '../types/task.js';
import { logger } from '../lib/logger.js';

export const createTaskRoutes = (taskService: TaskService): Router => {
  const router = Router();

  // POST /tasks - Create a task
  router.post('/', async (req: Request, res: Response) => {
    try {
      const taskData: CreateTaskRequest = req.body;
      const task = await taskService.createTask(taskData);
      
      logger.info('Nova tarefa criada via API', { taskId: task.id });
      res.status(201).json(task);
    } catch (error) {
      if (error instanceof ConflictError) {
        logger.warn('Conflito ao criar tarefa', { error: error.message });
        res.status(409).json({ error: error.message });
      } else if (error instanceof ValidationError) {
        logger.warn('Dados inválidos para criação de tarefa', { error: error.message });
        res.status(400).json({ error: error.message });
      } else {
        logger.error('Erro interno ao criar tarefa', { error: String(error) });
        res.status(500).json({ error: 'Erro interno do servidor' });
      }
    }
  });

  // GET /tasks - List all tasks (with optional filters)
  router.get('/', async (req: Request, res: Response) => {
    try {
      const filters: TaskFilters = {};
      
      if (req.query.status) {
        const status = String(req.query.status);
        if (!['todo', 'in-progress', 'done'].includes(status)) {
          return res.status(400).json({ 
            error: 'Status deve ser: todo, in-progress ou done' 
          });
        }
        filters.status = status as 'todo' | 'in-progress' | 'done';
      }

      if (req.query.dueDate) {
        const dueDate = String(req.query.dueDate);
        try {
          const date = new Date(dueDate);
          if (isNaN(date.getTime()) || dueDate !== date.toISOString()) {
            return res.status(400).json({ 
              error: 'Data de vencimento deve estar no formato ISO 8601' 
            });
          }
          filters.dueDate = dueDate;
        } catch {
          return res.status(400).json({ 
            error: 'Data de vencimento deve estar no formato ISO 8601' 
          });
        }
      }

      if (req.query.search) {
        const search = String(req.query.search);
        if (search.length > 200) {
          return res.status(400).json({
            error: 'Parâmetro search deve ter no máximo 200 caracteres',
          });
        }
        const trimmedSearch = search.trim();
        if (trimmedSearch.length > 0) {
          filters.search = trimmedSearch;
        }
      }

      const tasks = await taskService.getAllTasks(filters);
      logger.debug('Tarefas listadas via API', { count: tasks.length, filters });
      res.json(tasks);
    } catch (error) {
      logger.error('Erro interno ao listar tarefas', { error: String(error) });
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // GET /tasks/:id - Get single task
  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const task = await taskService.getTaskById(id);
      
      logger.debug('Tarefa recuperada via API', { taskId: id });
      res.json(task);
    } catch (error) {
      if (error instanceof NotFoundError) {
        logger.warn('Tentativa de acessar tarefa inexistente', { taskId: req.params.id });
        res.status(404).json({ error: error.message });
      } else {
        logger.error('Erro interno ao recuperar tarefa', { 
          taskId: req.params.id, 
          error: String(error) 
        });
        res.status(500).json({ error: 'Erro interno do servidor' });
      }
    }
  });

  // PUT /tasks/:id - Full update (idempotent)
  router.put('/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const taskData: UpdateTaskRequest = req.body;
      const task = await taskService.updateTask(id, taskData);
      
      logger.info('Tarefa atualizada completamente via API', { taskId: id });
      res.json(task);
    } catch (error) {
      if (error instanceof NotFoundError) {
        logger.warn('Tentativa de atualizar tarefa inexistente', { taskId: req.params.id });
        res.status(404).json({ error: error.message });
      } else if (error instanceof ConflictError) {
        logger.warn('Conflito ao atualizar tarefa', { 
          taskId: req.params.id, 
          error: error.message 
        });
        res.status(409).json({ error: error.message });
      } else if (error instanceof ValidationError) {
        logger.warn('Dados inválidos para atualização de tarefa', { 
          taskId: req.params.id, 
          error: error.message 
        });
        res.status(400).json({ error: error.message });
      } else {
        logger.error('Erro interno ao atualizar tarefa', { 
          taskId: req.params.id, 
          error: String(error) 
        });
        res.status(500).json({ error: 'Erro interno do servidor' });
      }
    }
  });

  // PATCH /tasks/:id - Partial update (title / status)
  router.patch('/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const taskData: PartialUpdateTaskRequest = req.body;
      const task = await taskService.partialUpdateTask(id, taskData);
      
      logger.info('Tarefa atualizada parcialmente via API', { taskId: id });
      res.json(task);
    } catch (error) {
      if (error instanceof NotFoundError) {
        logger.warn('Tentativa de atualizar parcialmente tarefa inexistente', { 
          taskId: req.params.id 
        });
        res.status(404).json({ error: error.message });
      } else if (error instanceof ConflictError) {
        logger.warn('Conflito ao atualizar parcialmente tarefa', { 
          taskId: req.params.id, 
          error: error.message 
        });
        res.status(409).json({ error: error.message });
      } else if (error instanceof ValidationError) {
        logger.warn('Dados inválidos para atualização parcial de tarefa', { 
          taskId: req.params.id, 
          error: error.message 
        });
        res.status(400).json({ error: error.message });
      } else {
        logger.error('Erro interno ao atualizar parcialmente tarefa', { 
          taskId: req.params.id, 
          error: String(error) 
        });
        res.status(500).json({ error: 'Erro interno do servidor' });
      }
    }
  });

  // DELETE /tasks/:id - Soft-delete (flag deletedAt)
  router.delete('/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await taskService.deleteTask(id);
      
      logger.info('Tarefa deletada via API', { taskId: id });
      res.status(204).send();
    } catch (error) {
      if (error instanceof NotFoundError) {
        logger.warn('Tentativa de deletar tarefa inexistente', { taskId: req.params.id });
        res.status(404).json({ error: error.message });
      } else {
        logger.error('Erro interno ao deletar tarefa', { 
          taskId: req.params.id, 
          error: String(error) 
        });
        res.status(500).json({ error: 'Erro interno do servidor' });
      }
    }
  });

  return router;
};
