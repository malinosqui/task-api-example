import pino from 'pino';

interface Logger {
  info(message: string, meta?: object): void;
  warn(message: string, meta?: object): void;
  error(message: string, meta?: object): void;
  debug(message: string, meta?: object): void;
}

class PinoLogger implements Logger {
  private logger: pino.Logger;

  constructor() {
    this.logger = pino({
      level: process.env.LOG_LEVEL ?? 'info',
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'yyyy-mm-dd HH:MM:ss',
          ignore: 'pid,hostname',
        },
      },
    });
  }

  info(message: string, meta?: object): void {
    this.logger.info(meta, message);
  }

  warn(message: string, meta?: object): void {
    this.logger.warn(meta, message);
  }

  error(message: string, meta?: object): void {
    this.logger.error(meta, message);
  }

  debug(message: string, meta?: object): void {
    this.logger.debug(meta, message);
  }
}

class ConsoleLogger implements Logger {
  info(message: string, meta?: object): void {
    console.log(`[INFO] ${message}`, meta ? JSON.stringify(meta) : '');
  }

  warn(message: string, meta?: object): void {
    console.warn(`[WARN] ${message}`, meta ? JSON.stringify(meta) : '');
  }

  error(message: string, meta?: object): void {
    console.error(`[ERROR] ${message}`, meta ? JSON.stringify(meta) : '');
  }

  debug(message: string, meta?: object): void {
    console.debug(`[DEBUG] ${message}`, meta ? JSON.stringify(meta) : '');
  }
}

const createLogger = (): Logger => {
  try {
    return new PinoLogger();
  } catch {
    return new ConsoleLogger();
  }
};

export const logger = createLogger();
export type { Logger }; 