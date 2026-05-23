import { logger } from '../shared/logger/logger';

type DbOperation = 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'TRANSACTION';

function inferOperation(method: string): DbOperation {
  if (method.startsWith('find') || method.startsWith('get')) return 'SELECT';
  if (method.startsWith('create') || method.startsWith('insert'))
    return 'INSERT';
  if (method.startsWith('update') || method.startsWith('upsert'))
    return 'UPDATE';
  if (method.startsWith('delete') || method.startsWith('soft')) return 'DELETE';
  return 'SELECT';
}

export async function dbExec<T>(
  operation: string,
  component: string,
  fn: () => Promise<T>,
): Promise<T> {
  try {
    return await fn();
  } catch (err: unknown) {
    logger.error(
      { err, operation, component },
      `DB error in ${component}.${operation}`,
    );
    throw Object.assign(new Error(`DB error in ${component}.${operation}`), {
      cause: err,
      dbOperation: inferOperation(operation),
      component,
    });
  }
}
