import type { Database } from './index';
import { db as defaultDb } from './index';

export type Transaction = Parameters<Parameters<Database['transaction']>[0]>[0];
export type DbOrTx = Database | Transaction;

export const withTransaction = async <T>(
  fn: (tx: Transaction) => Promise<T>,
  dbInstance: Database = defaultDb,
): Promise<T> => dbInstance.transaction(fn);

export const isTx = (dbOrTx: DbOrTx): boolean => !('transaction' in dbOrTx);
