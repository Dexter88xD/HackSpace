import 'reflect-metadata';
import dataSource from '../data-source';
import { seedUsers } from './users.seed';
import { seedSkills } from './skills.seed';
import { seedHackathons } from './hackathons.seed';

function assertDevelopmentEnvironment(): void {
  if (process.env.NODE_ENV !== 'development') {
    throw new Error('Development seeding requires NODE_ENV=development');
  }

  if (process.env.SEED_DEV_DATA !== 'true') {
    throw new Error('Set SEED_DEV_DATA=true to allow development seeding');
  }

  const database = process.env.POSTGRES_DB;
  const expectedDatabase = process.env.SEED_EXPECTED_DB;
  const host = process.env.POSTGRES_HOST;

  if (!database || !expectedDatabase || database !== expectedDatabase) {
    throw new Error('Database does not match SEED_EXPECTED_DB');
  }

  if (/prod|stag/i.test(database)) {
    throw new Error('Refusing to seed a production or staging database');
  }

  if (!['db', 'localhost', '127.0.0.1', '::1'].includes(host ?? '')) {
    throw new Error('Development seeding requires a local database host');
  }
}

async function main(): Promise<void> {
  assertDevelopmentEnvironment();
  await dataSource.initialize();
  try {
    await dataSource.transaction(async (manager) => {
      // Serialize concurrent seed runs without adding a seed-history table.
      await manager.query('SELECT pg_advisory_xact_lock(1337, 2026)');
      const users = await seedUsers(manager);
      await seedSkills(manager, users);
      await seedHackathons(
        manager,
        users.get('dev_user')!,
        users.get('dev_admin')!,
      );
    });
    console.log('Development seeding completed successfully');
  } finally {
    await dataSource.destroy();
  }
}

if (require.main === module) {
  void main().catch((error: unknown) => {
    console.error('Development seeding failed:', error);
    process.exitCode = 1;
  });
}
