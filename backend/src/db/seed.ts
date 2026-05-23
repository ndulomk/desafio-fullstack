import { db } from './index';
import { users, projects, tasks, comments } from './schema';
import { getEncryption } from '../shared/crypto/encryption.service';
import { logger } from '../shared/logger/logger';

const enc = getEncryption();

async function seed() {
  logger.info('Starting seed...');

  // Check if seed already ran
  const existing = await db.select().from(users).limit(1);
  if (existing.length > 0) {
    logger.info('Seed already applied, skipping');
    return;
  }

  // Create admin user
  const [admin] = await db
    .insert(users)
    .values({
      name: enc.encrypt('Admin User'),
      email: enc.encrypt('admin@mamboo.local'),
      emailHash: enc.hash('admin@mamboo.local'),
      passwordHash: await import('@node-rs/argon2').then((m) =>
        m.hash('admin123'),
      ),
      role: 'admin',
      isActive: true,
    })
    .returning();

  // Create regular user
  const [regular] = await db
    .insert(users)
    .values({
      name: enc.encrypt('Regular User'),
      email: enc.encrypt('user@mamboo.local'),
      emailHash: enc.hash('user@mamboo.local'),
      passwordHash: await import('@node-rs/argon2').then((m) =>
        m.hash('user123'),
      ),
      role: 'user',
      isActive: true,
    })
    .returning();

  // Create a project
  const [project] = await db
    .insert(projects)
    .values({
      name: 'Mamboo Kickoff',
      description: 'Projecto inicial para testes e demo',
      createdBy: admin.id,
    })
    .returning();

  // Create some tasks
  const [task] = await db
    .insert(tasks)
    .values([
      {
        title: 'Implementar auth',
        description: 'Login, register e refresh tokens',
        status: 'in_progress',
        position: 2000,
        projectId: project.id,
        assignedToUserId: regular.id,
        createdByUserId: admin.id,
      },
    ])
    .returning();

  // Create a comment
  await db.insert(comments).values({
    taskId: task.id,
    userId: regular.id,
    content: 'Vou começar hoje à tarde.',
  });

  logger.info('Seed completed successfully');
}

void seed().catch((err) => {
  logger.error(err, 'Seed failed');
  process.exit(1);
});
