import pino, { type Logger } from 'pino';
import { LogCategory } from './types';

const isDev = process.env.NODE_ENV !== 'production';

export const logger: Logger = pino({
  level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),
  transport: isDev
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  base: { service: 'mamboo-api', env: process.env.NODE_ENV },
  formatters: { level: (label) => ({ level: label }) },
  timestamp: pino.stdTimeFunctions.isoTime,
});

export const appLogger = logger.child({ category: LogCategory.APP });
export const httpLogger = logger.child({ category: LogCategory.HTTP });
export const dbLogger = logger.child({ category: LogCategory.DATABASE });
export const errorLogger = logger.child({ category: LogCategory.ERROR });
export const securityLogger = logger.child({ category: LogCategory.SECURITY });
