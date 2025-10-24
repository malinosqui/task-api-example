import request from 'supertest';
import type express from 'express';
import { createApp } from '../app.js';
import type { Task } from '../types/task.js';

let app: express.Application;
beforeEach(() => {
  app = createApp();
});

describe('Task API Routes', () => {
  describe('POST /tasks', () => {
    test('should create a new task with all fields', async () => {
      const taskData = {
        title: 'Nova tarefa teste',
        description: 'Descrição da tarefa',
        status: 'todo' as const,
        dueDate: '2024-12-31T23:59:59.999Z',
      };

      const response = await request(app)
        .post('/tasks')
        .send(taskData)
        .expect(201);

      expect(response.body).toMatchObject({
        title: taskData.title,
        description: taskData.description,
        status: taskData.status,
        dueDate: taskData.dueDate,
      });
      expect(response.body.id).toBeDefined();
      expect(response.body.createdAt).toBeDefined();
      expect(response.body.updatedAt).toBeDefined();
      expect(response.body.deletedAt).toBeUndefined();
    });

    test('should create a task with minimal fields', async () => {
      const taskData = {
        title: 'Tarefa mínima',
      };

      const response = await request(app)
        .post('/tasks')
        .send(taskData)
        .expect(201);

      expect(response.body).toMatchObject({
        title: taskData.title,
        status: 'todo',
      });
      expect(response.body.description).toBeUndefined();
      expect(response.body.dueDate).toBeUndefined();
    });

    test('should return 400 for missing title', async () => {
      const response = await request(app)
        .post('/tasks')
        .send({})
        .expect(400);

      expect(response.body).toEqual({
        error: 'Título é obrigatório',
      });
    });

    test('should return 400 for empty title', async () => {
      const response = await request(app)
        .post('/tasks')
        .send({ title: '   ' })
        .expect(400);

      expect(response.body).toEqual({
        error: 'Título é obrigatório',
      });
    });

    test('should return 400 for title too long', async () => {
      const longTitle = 'a'.repeat(201);
      const response = await request(app)
        .post('/tasks')
        .send({ title: longTitle })
        .expect(400);

      expect(response.body).toEqual({
        error: 'Título deve ter no máximo 200 caracteres',
      });
    });

    test('should return 400 for invalid status', async () => {
      const response = await request(app)
        .post('/tasks')
        .send({ title: 'Tarefa', status: 'invalid' })
        .expect(400);

      expect(response.body).toEqual({
        error: 'Status deve ser: todo, in-progress ou done',
      });
    });

    test('should return 409 for duplicate title', async () => {
      const taskData = { title: 'Tarefa única' };

      await request(app)
        .post('/tasks')
        .send(taskData)
        .expect(201);

      const response = await request(app)
        .post('/tasks')
        .send(taskData)
        .expect(409);

      expect(response.body).toEqual({
        error: 'Uma tarefa com este título já existe',
      });
    });
  });

  describe('GET /tasks', () => {
    let createdTasks: Task[];

    beforeEach(async () => {
      const tasksData = [
        { title: 'Tarefa Todo', status: 'todo' as const },
        { title: 'Tarefa Em Progresso', status: 'in-progress' as const },
        { title: 'Tarefa Concluída', status: 'done' as const },
        { title: 'Tarefa com Data', status: 'todo' as const, dueDate: '2024-12-31T23:59:59.999Z' },
      ];

      createdTasks = [];
      for (const taskData of tasksData) {
        const response = await request(app)
          .post('/tasks')
          .send(taskData);
        createdTasks.push(response.body);
      }
    });

    test('should return all tasks', async () => {
      const response = await request(app)
        .get('/tasks')
        .expect(200);

      expect(response.body).toHaveLength(4);
      expect(response.body.every((task: Task) => !task.deletedAt)).toBe(true);
    });

    test('should filter tasks by status', async () => {
      const response = await request(app)
        .get('/tasks?status=todo')
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body.every((task: Task) => task.status === 'todo')).toBe(true);
    });

    test('should filter tasks by dueDate', async () => {
      const response = await request(app)
        .get('/tasks?dueDate=2024-12-31T23:59:59.999Z')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0]?.dueDate).toBe('2024-12-31T23:59:59.999Z');
    });

    test('should filter tasks due before a given date', async () => {
      await request(app)
        .post('/tasks')
        .send({ title: 'Tarefa antes do prazo', status: 'todo', dueDate: '2024-05-15T00:00:00.000Z' });

      await request(app)
        .post('/tasks')
        .send({ title: 'Tarefa após o prazo', status: 'todo', dueDate: '2024-07-15T00:00:00.000Z' });

      const response = await request(app)
        .get('/tasks')
        .query({ dueBefore: '2024-06-01T00:00:00.000Z' })
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0]?.title).toBe('Tarefa antes do prazo');
    });

    test('should filter tasks due after a given date', async () => {
      const response = await request(app)
        .get('/tasks')
        .query({ dueAfter: '2024-12-01T00:00:00.000Z' })
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0]?.title).toBe('Tarefa com Data');
    });

    test('should filter tasks between dueAfter and dueBefore', async () => {
      await request(app)
        .post('/tasks')
        .send({ title: 'Tarefa dentro do intervalo', status: 'todo', dueDate: '2024-06-15T00:00:00.000Z' });

      await request(app)
        .post('/tasks')
        .send({ title: 'Tarefa fora do intervalo', status: 'todo', dueDate: '2024-08-01T00:00:00.000Z' });

      const response = await request(app)
        .get('/tasks')
        .query({ dueAfter: '2024-06-01T00:00:00.000Z', dueBefore: '2024-06-30T00:00:00.000Z' })
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0]?.title).toBe('Tarefa dentro do intervalo');
    });

    test('should return tasks sorted by createdAt descending by default', async () => {
      const response = await request(app)
        .get('/tasks')
        .expect(200);

      const createdAtValues = response.body.map((task: Task) => task.createdAt);
      const sortedCreatedAt = [...createdAtValues].sort((a, b) => {
        if (a === b) {
          return 0;
        }
        return a > b ? -1 : 1;
      });

      expect(createdAtValues).toEqual(sortedCreatedAt);
      expect(response.body.some((task: Task) => task.title === 'Tarefa com Data')).toBe(true);
      expect(response.body.some((task: Task) => task.title === 'Tarefa Todo')).toBe(true);
    });

    test('should filter tasks by search term in title or description', async () => {
      await request(app)
        .post('/tasks')
        .send({ title: 'Planejar Sprint', description: 'Revisar backlog do produto' });

      const responseByTitle = await request(app)
        .get('/tasks')
        .query({ search: 'progresso' })
        .expect(200);

      expect(responseByTitle.body).toHaveLength(1);
      expect(responseByTitle.body[0]?.title).toBe('Tarefa Em Progresso');

      const responseByDescription = await request(app)
        .get('/tasks')
        .query({ search: 'backlog' })
        .expect(200);

      expect(responseByDescription.body).toHaveLength(1);
      expect(responseByDescription.body[0]?.title).toBe('Planejar Sprint');
    });

    test('should sort tasks by dueDate ascending', async () => {
      await request(app)
        .post('/tasks')
        .send({ title: 'Tarefa com dueDate mais próxima', status: 'todo', dueDate: '2024-01-01T00:00:00.000Z' });

      await request(app)
        .post('/tasks')
        .send({ title: 'Tarefa com dueDate mais distante', status: 'todo', dueDate: '2025-01-01T00:00:00.000Z' });

      const response = await request(app)
        .get('/tasks')
        .query({ sortBy: 'dueDate', sortOrder: 'asc' })
        .expect(200);

      expect(response.body[0]?.title).toBe('Tarefa com dueDate mais próxima');
      const dueDates = response.body
        .filter((task: Task) => task.dueDate)
        .map((task: Task) => task.dueDate);
      expect(dueDates).toEqual([...dueDates].sort());
      expect(response.body[response.body.length - 1]?.dueDate).toBeUndefined();
    });

    test('should apply pagination defaults and expose metadata headers', async () => {
      for (let index = 0; index < 25; index += 1) {
        await request(app)
          .post('/tasks')
          .send({ title: `Tarefa extra ${index}`, status: 'todo' });
      }

      const response = await request(app)
        .get('/tasks')
        .expect(200);

      expect(response.body).toHaveLength(20);
      expect(response.headers['x-total-count']).toBe('29');
      expect(response.headers['x-total-pages']).toBe('2');
      expect(response.headers['x-page']).toBe('1');
      expect(response.headers['x-page-size']).toBe('20');
    });

    test('should return requested page and page size', async () => {
      for (let index = 0; index < 16; index += 1) {
        await request(app)
          .post('/tasks')
          .send({ title: `Paginacao ${index}`, status: 'todo' });
      }

      const response = await request(app)
        .get('/tasks')
        .query({ page: '2', pageSize: '10', sortBy: 'createdAt', sortOrder: 'asc' })
        .expect(200);

      expect(response.body).toHaveLength(10);
      expect(response.body[0]?.title).toBe('Paginacao 6');
      expect(response.headers['x-page']).toBe('2');
      expect(response.headers['x-page-size']).toBe('10');
    });

    test('should return 400 for invalid status filter', async () => {
      const response = await request(app)
        .get('/tasks?status=invalid')
        .expect(400);

      expect(response.body).toEqual({
        error: 'Status deve ser: todo, in-progress ou done',
      });
    });

    test('should return 400 for invalid dueDate filter', async () => {
      const response = await request(app)
        .get('/tasks?dueDate=invalid-date')
        .expect(400);

      expect(response.body).toEqual({
        error: 'Data de vencimento deve estar no formato ISO 8601',
      });
    });

    test('should return 400 for invalid dueBefore filter', async () => {
      const response = await request(app)
        .get('/tasks')
        .query({ dueBefore: 'invalid-date' })
        .expect(400);

      expect(response.body).toEqual({
        error: 'Parâmetro dueBefore deve estar no formato ISO 8601',
      });
    });

    test('should return 400 for invalid dueAfter filter', async () => {
      const response = await request(app)
        .get('/tasks')
        .query({ dueAfter: 'invalid-date' })
        .expect(400);

      expect(response.body).toEqual({
        error: 'Parâmetro dueAfter deve estar no formato ISO 8601',
      });
    });

    test('should return 400 when dueAfter is greater than dueBefore', async () => {
      const response = await request(app)
        .get('/tasks')
        .query({
          dueAfter: '2024-07-01T00:00:00.000Z',
          dueBefore: '2024-06-01T00:00:00.000Z',
        })
        .expect(400);

      expect(response.body).toEqual({
        error: 'Parâmetro dueAfter deve ser anterior ou igual a dueBefore',
      });
    });

    test('should return 400 for invalid sort field', async () => {
      const response = await request(app)
        .get('/tasks')
        .query({ sortBy: 'invalid-field' })
        .expect(400);

      expect(response.body).toEqual({
        error: 'Parâmetro sortBy deve ser: createdAt, updatedAt ou dueDate',
      });
    });

    test('should return 400 for invalid sort order', async () => {
      const response = await request(app)
        .get('/tasks')
        .query({ sortOrder: 'sideways' })
        .expect(400);

      expect(response.body).toEqual({
        error: 'Parâmetro sortOrder deve ser: asc ou desc',
      });
    });

    test('should return 400 for invalid page parameter', async () => {
      const response = await request(app)
        .get('/tasks')
        .query({ page: '0' })
        .expect(400);

      expect(response.body).toEqual({
        error: 'Parâmetro page deve ser um inteiro maior ou igual a 1',
      });
    });

    test('should return 400 for invalid pageSize parameter', async () => {
      const response = await request(app)
        .get('/tasks')
        .query({ pageSize: '101' })
        .expect(400);

      expect(response.body).toEqual({
        error: 'Parâmetro pageSize deve ser um inteiro entre 1 e 100',
      });
    });

    test('should return 400 for search term longer than allowed', async () => {
      const tooLongSearch = 'a'.repeat(201);
      const response = await request(app)
        .get('/tasks')
        .query({ search: tooLongSearch })
        .expect(400);

      expect(response.body).toEqual({
        error: 'Parâmetro search deve ter no máximo 200 caracteres',
      });
    });

    test('should not return deleted tasks', async () => {
      const taskToDelete = createdTasks[0];
      if (taskToDelete) {
        await request(app)
          .delete(`/tasks/${taskToDelete.id}`)
          .expect(204);

        const response = await request(app)
          .get('/tasks')
          .expect(200);

        expect(response.body).toHaveLength(3);
        expect(response.body.find((task: Task) => task.id === taskToDelete.id)).toBeUndefined();
      }
    });
  });

  describe('GET /tasks/summary', () => {
    test('should return task summary metrics', async () => {
      const now = Date.now();
      const overdueDate = new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString();
      const upcomingDate = new Date(now + 2 * 24 * 60 * 60 * 1000).toISOString();
      const distantDate = new Date(now + 10 * 24 * 60 * 60 * 1000).toISOString();

      await request(app)
        .post('/tasks')
        .send({ title: 'Tarefa atrasada', status: 'todo', dueDate: overdueDate });

      await request(app)
        .post('/tasks')
        .send({ title: 'Tarefa chegando', status: 'in-progress', dueDate: upcomingDate });

      await request(app)
        .post('/tasks')
        .send({ title: 'Tarefa concluída', status: 'done', dueDate: distantDate });

      await request(app)
        .post('/tasks')
        .send({ title: 'Tarefa sem prazo', status: 'todo' });

      const response = await request(app)
        .get('/tasks/summary')
        .expect(200);

      expect(response.body).toEqual({
        total: 4,
        statusCounts: {
          todo: 2,
          inProgress: 1,
          done: 1,
        },
        overdue: 1,
        dueSoon: 1,
      });
    });
  });

  describe('GET /tasks/:id', () => {
    let createdTask: Task;

    beforeEach(async () => {
      const response = await request(app)
        .post('/tasks')
        .send({ title: 'Tarefa para buscar' });
      createdTask = response.body;
    });

    test('should return a single task by id', async () => {
      const response = await request(app)
        .get(`/tasks/${createdTask.id}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: createdTask.id,
        title: 'Tarefa para buscar',
        status: 'todo',
      });
    });

    test('should return 404 for non-existent task', async () => {
      const response = await request(app)
        .get('/tasks/00000000-0000-0000-0000-000000000000')
        .expect(404);

      expect(response.body).toEqual({
        error: 'Tarefa não encontrada',
      });
    });

    test('should return 404 for deleted task', async () => {
      await request(app)
        .delete(`/tasks/${createdTask.id}`)
        .expect(204);

      const response = await request(app)
        .get(`/tasks/${createdTask.id}`)
        .expect(404);

      expect(response.body).toEqual({
        error: 'Tarefa não encontrada',
      });
    });
  });

  describe('PUT /tasks/:id', () => {
    let createdTask: Task;

    beforeEach(async () => {
      const response = await request(app)
        .post('/tasks')
        .send({ title: 'Tarefa para atualizar' });
      createdTask = response.body;
    });

    test('should update a task completely', async () => {
      const updateData = {
        title: 'Tarefa atualizada',
        description: 'Nova descrição',
        status: 'done' as const,
        dueDate: '2024-12-31T23:59:59.999Z',
      };

      const response = await request(app)
        .put(`/tasks/${createdTask.id}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject(updateData);
      expect(response.body.updatedAt).not.toBe(createdTask.updatedAt);
    });

    test('should return 404 for non-existent task', async () => {
      const response = await request(app)
        .put('/tasks/00000000-0000-0000-0000-000000000000')
        .send({ title: 'Nova tarefa', status: 'todo' })
        .expect(404);

      expect(response.body).toEqual({
        error: 'Tarefa não encontrada',
      });
    });

    test('should return 400 for invalid data', async () => {
      const response = await request(app)
        .put(`/tasks/${createdTask.id}`)
        .send({ title: '', status: 'todo' })
        .expect(400);

      expect(response.body).toEqual({
        error: 'Título é obrigatório',
      });
    });

    test('should return 409 for duplicate title', async () => {
      await request(app)
        .post('/tasks')
        .send({ title: 'Outro título' });

      const response = await request(app)
        .put(`/tasks/${createdTask.id}`)
        .send({ title: 'Outro título', status: 'todo' })
        .expect(409);

      expect(response.body).toEqual({
        error: 'Uma tarefa com este título já existe',
      });
    });
  });

  describe('PATCH /tasks/:id', () => {
    let createdTask: Task;

    beforeEach(async () => {
      const response = await request(app)
        .post('/tasks')
        .send({ title: 'Tarefa para atualizar parcialmente' });
      createdTask = response.body;
    });

    test('should update task title only', async () => {
      const response = await request(app)
        .patch(`/tasks/${createdTask.id}`)
        .send({ title: 'Novo título' })
        .expect(200);

      expect(response.body.title).toBe('Novo título');
      expect(response.body.status).toBe(createdTask.status);
    });

    test('should update task status only', async () => {
      const response = await request(app)
        .patch(`/tasks/${createdTask.id}`)
        .send({ status: 'done' })
        .expect(200);

      expect(response.body.status).toBe('done');
      expect(response.body.title).toBe(createdTask.title);
    });

    test('should update both title and status', async () => {
      const response = await request(app)
        .patch(`/tasks/${createdTask.id}`)
        .send({ title: 'Título e status', status: 'in-progress' })
        .expect(200);

      expect(response.body.title).toBe('Título e status');
      expect(response.body.status).toBe('in-progress');
    });

    test('should return 400 for empty update data', async () => {
      const response = await request(app)
        .patch(`/tasks/${createdTask.id}`)
        .send({})
        .expect(400);

      expect(response.body).toEqual({
        error: 'Pelo menos um campo deve ser fornecido para atualização',
      });
    });

    test('should return 404 for non-existent task', async () => {
      const response = await request(app)
        .patch('/tasks/00000000-0000-0000-0000-000000000000')
        .send({ title: 'Novo título' })
        .expect(404);

      expect(response.body).toEqual({
        error: 'Tarefa não encontrada',
      });
    });
  });

  describe('DELETE /tasks/:id', () => {
    let createdTask: Task;

    beforeEach(async () => {
      const response = await request(app)
        .post('/tasks')
        .send({ title: 'Tarefa para deletar' });
      createdTask = response.body;
    });

    test('should soft delete a task', async () => {
      await request(app)
        .delete(`/tasks/${createdTask.id}`)
        .expect(204);

      const response = await request(app)
        .get(`/tasks/${createdTask.id}`)
        .expect(404);

      expect(response.body).toEqual({
        error: 'Tarefa não encontrada',
      });
    });

    test('should return 404 for non-existent task', async () => {
      const response = await request(app)
        .delete('/tasks/00000000-0000-0000-0000-000000000000')
        .expect(404);

      expect(response.body).toEqual({
        error: 'Tarefa não encontrada',
      });
    });

    test('should return 404 when deleting already deleted task', async () => {
      await request(app)
        .delete(`/tasks/${createdTask.id}`)
        .expect(204);

      const response = await request(app)
        .delete(`/tasks/${createdTask.id}`)
        .expect(404);

      expect(response.body).toEqual({
        error: 'Tarefa não encontrada',
      });
    });
  });

  describe('Health Check', () => {
    test('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'ok',
        timestamp: expect.any(String),
        uptime: expect.any(Number),
        version: expect.any(String),
      });
    });
  });

  describe('Not Found Routes', () => {
    test('should return 404 for unknown endpoints', async () => {
      const response = await request(app)
        .get('/unknown-endpoint')
        .expect(404);

      expect(response.body).toEqual({
        error: 'Endpoint não encontrado',
      });
    });
  });
}); 
