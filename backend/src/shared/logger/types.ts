export enum LogCategory {
  APP = 'app',
  HTTP = 'http',
  DATABASE = 'database',
  ERROR = 'error',
  SECURITY = 'security',
}

export interface LogContext {
  category: LogCategory;
  requestId?: string;
  userId?: string;
  [key: string]: unknown;
}
