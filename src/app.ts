import express, { type Request, type Response, type NextFunction } from 'express';
import { createTaskRoutes } from './routes/tasks.js';
import { TaskService } from './services/taskService.js';
import { MemoryStore } from './data/memoryStore.js';
import { logger } from './lib/logger.js';
import { v4 as uuidv4 } from 'uuid';

export const createApp = (): express.Application => {
  const app = express();

  // Security: remove X-Powered-By header
  app.disable('x-powered-by');

  // Middleware para parsing JSON
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Middleware de correlação e logging
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    const requestId = uuidv4();

    res.setHeader('X-Request-Id', requestId);
    res.locals.requestId = requestId;

    res.on('finish', () => {
      const duration = Date.now() - start;
      logger.info('Requisição HTTP processada', {
        requestId,
        method: req.method,
        url: req.originalUrl ?? req.url,
        statusCode: res.statusCode,
        durationMs: duration,
        contentLength: res.getHeader('Content-Length'),
        userAgent: req.get('User-Agent'),
        ip: req.ip,
      });
    });

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
// Compatível com CommonJS (require.main) e ambientes de teste
// ts-node/tsx respeitam require.main quando o pacote é CJS
// (package.json sem "type": "module" e tsconfig module: commonjs)
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - require/module são definidos em tempo de execução Node (CJS)
if (typeof require !== 'undefined' && typeof module !== 'undefined' && require.main === module) {
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
