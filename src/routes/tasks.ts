import { Router, type Request, type Response } from 'express';
import { TaskService, ConflictError, NotFoundError, ValidationError } from '../services/taskService.js';
import type { CreateTaskRequest, UpdateTaskRequest, PartialUpdateTaskRequest, TaskFilters, TaskSortField, SortOrder } from '../types/task.js';
import { logger } from '../lib/logger.js';

const isValidISODateString = (value: string): boolean => {
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && value === date.toISOString();
};

export const createTaskRoutes = (taskService: TaskService): Router => {
  const router = Router();

  // POST /tasks - Create a task
  router.post('/', async (req: Request, res: Response) => {
    try {
      const taskData: CreateTaskRequest = req.body;
      const task = await taskService.createTask(taskData);
      
      logger.info('Nova tarefa criada via API', { taskId: task.id });
      return res.status(201).json(task);
    } catch (error) {
      if (error instanceof ConflictError) {
        logger.warn('Conflito ao criar tarefa', { error: error.message });
        return res.status(409).json({ error: error.message });
      } else if (error instanceof ValidationError) {
        logger.warn('Dados inválidos para criação de tarefa', { error: error.message });
        return res.status(400).json({ error: error.message });
      } else {
        logger.error('Erro interno ao criar tarefa', { error: String(error) });
        return res.status(500).json({ error: 'Erro interno do servidor' });
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
        if (!isValidISODateString(dueDate)) {
          return res.status(400).json({
            error: 'Data de vencimento deve estar no formato ISO 8601',
          });
        }
        filters.dueDate = dueDate;
      }

      if (req.query.dueBefore) {
        const dueBefore = String(req.query.dueBefore);
        if (!isValidISODateString(dueBefore)) {
          return res.status(400).json({
            error: 'Parâmetro dueBefore deve estar no formato ISO 8601',
          });
        }
        filters.dueBefore = dueBefore;
      }

      if (req.query.dueAfter) {
        const dueAfter = String(req.query.dueAfter);
        if (!isValidISODateString(dueAfter)) {
          return res.status(400).json({
            error: 'Parâmetro dueAfter deve estar no formato ISO 8601',
          });
        }
        filters.dueAfter = dueAfter;
      }

      if (filters.dueBefore && filters.dueAfter) {
        const dueBeforeTime = new Date(filters.dueBefore).getTime();
        const dueAfterTime = new Date(filters.dueAfter).getTime();
        if (dueAfterTime > dueBeforeTime) {
          return res.status(400).json({
            error: 'Parâmetro dueAfter deve ser anterior ou igual a dueBefore',
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

      const defaultPage = 1;
      const defaultPageSize = 20;
      let page = defaultPage;
      let pageSize = defaultPageSize;

      if (req.query.page) {
        const parsedPage = Number.parseInt(String(req.query.page), 10);
        if (Number.isNaN(parsedPage) || parsedPage < 1) {
          return res.status(400).json({
            error: 'Parâmetro page deve ser um inteiro maior ou igual a 1',
          });
        }
        page = parsedPage;
      }

      if (req.query.pageSize) {
        const parsedPageSize = Number.parseInt(String(req.query.pageSize), 10);
        if (Number.isNaN(parsedPageSize) || parsedPageSize < 1 || parsedPageSize > 100) {
          return res.status(400).json({
            error: 'Parâmetro pageSize deve ser um inteiro entre 1 e 100',
          });
        }
        pageSize = parsedPageSize;
      }

      const validSortFields: TaskSortField[] = ['createdAt', 'updatedAt', 'dueDate'];
      const validSortOrders: SortOrder[] = ['asc', 'desc'];

      if (req.query.sortBy) {
        const sortBy = String(req.query.sortBy) as TaskSortField;
        if (!validSortFields.includes(sortBy)) {
          return res.status(400).json({
            error: 'Parâmetro sortBy deve ser: createdAt, updatedAt ou dueDate',
          });
        }
        filters.sortBy = sortBy;
      }

      if (req.query.sortOrder) {
        const sortOrder = String(req.query.sortOrder) as SortOrder;
        if (!validSortOrders.includes(sortOrder)) {
          return res.status(400).json({
            error: 'Parâmetro sortOrder deve ser: asc ou desc',
          });
        }
        filters.sortOrder = sortOrder;
      }

      filters.page = page;
      filters.pageSize = pageSize;

      const tasks = await taskService.getAllTasks(filters);
      const totalCount = tasks.length;
      const totalPages = totalCount === 0 ? 0 : Math.ceil(totalCount / pageSize);
      const startIndex = (page - 1) * pageSize;
      const paginatedTasks = tasks.slice(startIndex, startIndex + pageSize);

      res.setHeader('X-Total-Count', String(totalCount));
      res.setHeader('X-Total-Pages', String(totalPages));
      res.setHeader('X-Page', String(page));
      res.setHeader('X-Page-Size', String(pageSize));

      logger.debug('Tarefas listadas via API', {
        totalCount,
        page,
        pageSize,
        totalPages,
        filters: { ...filters },
      });
      return res.json(paginatedTasks);
    } catch (error) {
      logger.error('Erro interno ao listar tarefas', { error: String(error) });
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // GET /tasks/summary - Aggregate task metrics
  router.get('/summary', async (_req: Request, res: Response) => {
    try {
      const summary = await taskService.getTaskSummary();
      return res.json(summary);
    } catch (error) {
      logger.error('Erro interno ao obter resumo de tarefas', { error: String(error) });
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // GET /tasks/:id - Get single task
  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ error: 'Parâmetro id é obrigatório' });
      }
      const task = await taskService.getTaskById(id);
      
      logger.debug('Tarefa recuperada via API', { taskId: id });
      return res.json(task);
    } catch (error) {
      if (error instanceof NotFoundError) {
        logger.warn('Tentativa de acessar tarefa inexistente', { taskId: req.params.id });
        return res.status(404).json({ error: error.message });
      } else {
        logger.error('Erro interno ao recuperar tarefa', { 
          taskId: req.params.id, 
          error: String(error) 
        });
        return res.status(500).json({ error: 'Erro interno do servidor' });
      }
    }
  });

  // PUT /tasks/:id - Full update (idempotent)
  router.put('/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ error: 'Parâmetro id é obrigatório' });
      }
      const taskData: UpdateTaskRequest = req.body;
      const task = await taskService.updateTask(id, taskData);
      
      logger.info('Tarefa atualizada completamente via API', { taskId: id });
      return res.json(task);
    } catch (error) {
      if (error instanceof NotFoundError) {
        logger.warn('Tentativa de atualizar tarefa inexistente', { taskId: req.params.id });
        return res.status(404).json({ error: error.message });
      } else if (error instanceof ConflictError) {
        logger.warn('Conflito ao atualizar tarefa', { 
          taskId: req.params.id, 
          error: error.message 
        });
        return res.status(409).json({ error: error.message });
      } else if (error instanceof ValidationError) {
        logger.warn('Dados inválidos para atualização de tarefa', { 
          taskId: req.params.id, 
          error: error.message 
        });
        return res.status(400).json({ error: error.message });
      } else {
        logger.error('Erro interno ao atualizar tarefa', { 
          taskId: req.params.id, 
          error: String(error) 
        });
        return res.status(500).json({ error: 'Erro interno do servidor' });
      }
    }
  });

  // PATCH /tasks/:id - Partial update (title / status)
  router.patch('/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ error: 'Parâmetro id é obrigatório' });
      }
      const taskData: PartialUpdateTaskRequest = req.body;
      const task = await taskService.partialUpdateTask(id, taskData);
      
      logger.info('Tarefa atualizada parcialmente via API', { taskId: id });
      return res.json(task);
    } catch (error) {
      if (error instanceof NotFoundError) {
        logger.warn('Tentativa de atualizar parcialmente tarefa inexistente', { 
          taskId: req.params.id 
        });
        return res.status(404).json({ error: error.message });
      } else if (error instanceof ConflictError) {
        logger.warn('Conflito ao atualizar parcialmente tarefa', { 
          taskId: req.params.id, 
          error: error.message 
        });
        return res.status(409).json({ error: error.message });
      } else if (error instanceof ValidationError) {
        logger.warn('Dados inválidos para atualização parcial de tarefa', { 
          taskId: req.params.id, 
          error: error.message 
        });
        return res.status(400).json({ error: error.message });
      } else {
        logger.error('Erro interno ao atualizar parcialmente tarefa', { 
          taskId: req.params.id, 
          error: String(error) 
        });
        return res.status(500).json({ error: 'Erro interno do servidor' });
      }
    }
  });

  // DELETE /tasks/:id - Soft-delete (flag deletedAt)
  router.delete('/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ error: 'Parâmetro id é obrigatório' });
      }
      await taskService.deleteTask(id);
      
      logger.info('Tarefa deletada via API', { taskId: id });
      return res.status(204).send();
    } catch (error) {
      if (error instanceof NotFoundError) {
        logger.warn('Tentativa de deletar tarefa inexistente', { taskId: req.params.id });
        return res.status(404).json({ error: error.message });
      } else {
        logger.error('Erro interno ao deletar tarefa', { 
          taskId: req.params.id, 
          error: String(error) 
        });
        return res.status(500).json({ error: 'Erro interno do servidor' });
      }
    }
  });

  return router;
};
