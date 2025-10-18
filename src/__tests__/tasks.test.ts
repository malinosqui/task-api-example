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

    test('should return tasks sorted by createdAt descending by default', async () => {
      const response = await request(app)
        .get('/tasks')
        .expect(200);

      expect(response.body[0]?.title).toBe('Tarefa com Data');
      expect(response.body[response.body.length - 1]?.title).toBe('Tarefa Todo');
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
