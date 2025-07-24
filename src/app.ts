import express, { type Request, type Response, type NextFunction } from 'express';
import { createTaskRoutes } from './routes/tasks.js';
import { TaskService } from './services/taskService.js';
import { MemoryStore } from './data/memoryStore.js';
import { logger } from './lib/logger.js';

export const createApp = (): express.Application => {
  const app = express();

  // Middleware para parsing JSON
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Middleware de logging
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    const originalSend = res.send;

    res.send = function (body) {
      const duration = Date.now() - start;
      logger.info('Requisição HTTP processada', {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
      });
      return originalSend.call(this, body);
    };

    next();
  });

  // Health check endpoint
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version ?? '1.0.0',
    });
  });

  // Configurar dependências
  const dataStore = new MemoryStore();
  const taskService = new TaskService(dataStore);

  // Rotas da API
  app.use('/tasks', createTaskRoutes(taskService));

  // Middleware para rotas não encontradas
  app.use('*', (_req: Request, res: Response) => {
    res.status(404).json({ error: 'Endpoint não encontrado' });
  });

  // Middleware global de tratamento de erros
  app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
    logger.error('Erro não capturado na aplicação', {
      error: error.message,
      stack: error.stack,
    });

    if (res.headersSent) {
      return;
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
  });

  return app;
};

// Inicializar servidor se executado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const app = createApp();
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.listen(port, () => {
    logger.info('Servidor iniciado com sucesso', {
      port,
      environment: process.env.NODE_ENV ?? 'development',
      nodeVersion: process.version,
    });
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('Recebido SIGTERM, encerrando servidor graciosamente');
    process.exit(0);
  });

  process.on('SIGINT', () => {
    logger.info('Recebido SIGINT, encerrando servidor graciosamente');
    process.exit(0);
  });
} 