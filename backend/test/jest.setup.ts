import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.test for integration tests, fallback to .env
config({ path: resolve(process.cwd(), '.env.test') });
config({ path: resolve(process.cwd(), '.env') });

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.ENCRYPTION_KEY =
  process.env.ENCRYPTION_KEY ||
  '0000000000000000000000000000000000000000000000000000000000000000';
