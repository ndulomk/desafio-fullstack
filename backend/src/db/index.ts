import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';
import 'dotenv/config';

const connectionString =
  `postgresql://${process.env.DB_USER || 'edgar'}:` +
  `${process.env.DB_PASSWORD || '123456'}@` +
  `${process.env.DB_HOST || 'localhost'}:` +
  `${process.env.DB_PORT || 5432}/` +
  `${process.env.DB_NAME || 'mamboo'}` +
  `${process.env.DB_SSL === 'true' ? '?sslmode=require' : ''}`;

export const sql = postgres(connectionString, {
  max: Number(process.env.DB_MAX_CONNECTIONS) || 10,
  idle_timeout: 20,
  connect_timeout: 10,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  onnotice: () => {},
});

export const db = drizzle(sql, { schema });

export const migrationClient = postgres(connectionString, {
  max: 1,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await sql`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

export async function closeDatabaseConnection(): Promise<void> {
  await sql.end({ timeout: 5 });
}

export type Database = typeof db;
export * from './schema';
