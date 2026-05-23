import { migrationClient } from './index';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';

const MIGRATIONS_DIR = path.join(__dirname, '../../drizzle');

async function ensureSetup() {
  await migrationClient`CREATE SCHEMA IF NOT EXISTS "drizzle"`;
  await migrationClient`
    CREATE TABLE IF NOT EXISTS "drizzle"."drizzle_migrations" (
      id        serial PRIMARY KEY,
      name      text UNIQUE,
      hash      text NOT NULL,
      created_at bigint NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint
    )
  `;
  await migrationClient`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`;
  await migrationClient`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
}

async function getApplied(): Promise<Map<string, string>> {
  const rows = await migrationClient`
    SELECT COALESCE(name, 'migration-' || id::text) AS name, hash
    FROM "drizzle"."drizzle_migrations" ORDER BY id
  `;
  const map = new Map<string, string>();
  for (const r of rows as unknown as Array<{ name: string; hash: string }>)
    map.set(r.name, r.hash);
  return map;
}

async function markApplied(name: string, hash: string) {
  await migrationClient`
    INSERT INTO "drizzle"."drizzle_migrations" (name, hash, created_at)
    VALUES (${name}, ${hash}, (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint)
  `;
}

function hashContent(content: string): string {
  return crypto
    .createHash('sha256')
    .update(content)
    .digest('hex')
    .substring(0, 16);
}

async function runMigrations() {
  console.log('Mamboo — Migrations');

  await ensureSetup();
  const applied = await getApplied();
  console.log(`  • ${applied.size} migration(s) already applied`);

  const files = await fs.readdir(MIGRATIONS_DIR);
  const sqlFiles = files
    .filter(
      (f) => f.endsWith('.sql') && !f.startsWith('.') && !f.startsWith('meta'),
    )
    .sort();

  const pending: Array<{ name: string; content: string }> = [];

  for (const file of sqlFiles) {
    const name = file.replace(/\.sql$/, '');
    const content = await fs.readFile(path.join(MIGRATIONS_DIR, file), 'utf-8');
    if (!applied.has(name)) {
      pending.push({ name, content });
      continue;
    }
    if (applied.get(name) !== hashContent(content)) {
      console.log(`  ⚠  ${name} — hash mismatch (changed after applied)`);
    }
  }

  if (pending.length === 0) {
    console.log('  ✓ Up to date\n');
    await migrationClient.end();
    return;
  }

  console.log(`  • ${pending.length} migration(s) pending\n`);

  for (const { name, content } of pending) {
    const statements = content
      .split('--> statement-breakpoint')
      .map((s) => s.trim())
      .filter(Boolean);
    const hash = hashContent(content);
    process.stdout.write(`  ${name} (${statements.length} stmts) ... `);
    try {
      await migrationClient`BEGIN`;
      for (const stmt of statements) {
        try {
          await migrationClient.unsafe(stmt);
        } catch (err: unknown) {
          const e = err as { code?: string };
          if (['42701', '42P07', '42710'].includes(e.code ?? '')) continue;
          throw err;
        }
      }
      await migrationClient`COMMIT`;
      await markApplied(name, hash);
      console.log('Completed');
    } catch (err: unknown) {
      await migrationClient`ROLLBACK`;
      console.error(`  Migration "${name}" FAILED — rolled back.`);
      console.error(`  ${(err as Error).message ?? JSON.stringify(err)}\n`);
      await migrationClient.end();
      process.exit(1);
    }
  }

  console.log(`\n  ✓ ${pending.length} migration(s) applied\n`);
  await migrationClient.end();
}

void runMigrations();
