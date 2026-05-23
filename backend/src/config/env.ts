import 'dotenv/config';

function required(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

function optional(key: string, fallback: string): string {
  return process.env[key] || fallback;
}

export const env = {
  NODE_ENV: optional('NODE_ENV', 'development'),
  PORT: Number(optional('PORT', '3000')),
  LOG_LEVEL: optional('LOG_LEVEL', 'debug'),

  DB_HOST: optional('DB_HOST', 'localhost'),
  DB_PORT: Number(optional('DB_PORT', '5432')),
  DB_USER: optional('DB_USER', 'edgar'),
  DB_PASSWORD: optional('DB_PASSWORD', '123456'),
  DB_NAME: optional('DB_NAME', 'mamboo'),
  DB_SSL: optional('DB_SSL', 'false') === 'true',
  DB_MAX_CONNECTIONS: Number(optional('DB_MAX_CONNECTIONS', '10')),

  JWT_SECRET: required('JWT_SECRET'),
  JWT_EXPIRES_IN: optional('JWT_EXPIRES_IN', '7d'),

  ENCRYPTION_KEY: optional(
    'ENCRYPTION_KEY',
    '0000000000000000000000000000000000000000000000000000000000000000',
  ),
} as const;
