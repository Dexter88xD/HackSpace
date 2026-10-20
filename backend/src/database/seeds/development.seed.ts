import 'reflect-metadata';
import * as bcrypt from 'bcrypt';
import { EntityManager } from 'typeorm';
import dataSource from '../data-source';
import { User } from '../entities/user.entity';
import { RoleName, UserRole } from '../entities/user-role.entity';
import { Hackathon } from '../entities/hackathon.entity';
import { HackathonSettings } from '../entities/hackathon-settings.entity';
import {
  HackathonPhase,
  HackathonPhaseName,
} from '../entities/hackathon-phase.entity';
import { HackathonUser, HackRoleName } from '../entities/hackathon-user.entity';

const DAY = 24 * 60 * 60 * 1000;
const HACKATHON_COUNT = 200;
const SEED_PREFIX = '[DEV]';

const themes = [
  'Artificial Intelligence',
  'Smart Agriculture',
  'Renewable Energy',
  'Cybersecurity',
  'Digital Healthcare',
  'Financial Inclusion',
  'Open Data',
  'Climate Technology',
  'Education Technology',
  'Ocean Protection',
  'Robotics',
  'Smart Cities',
  'Cloud Computing',
  'Data Engineering',
  'Accessibility',
  'Water Conservation',
  'Sustainable Transport',
  'Space Technology',
  'Language Learning',
  'Cultural Heritage',
];

const formats = [
  'Challenge',
  'Hackathon',
  'Innovation Cup',
  'Buildathon',
  'Sprint',
  'Hackfest',
  'Open',
  'Weekend',
  'Lab',
  'Quest',
];

const organizations = [
  'HackSpace',
  'Morocco Tech Community',
  'Atlas Innovation',
  'Digital Future Lab',
  'Open Source Collective',
  'Campus Innovation Network',
  'Green Technology Alliance',
  'Data Builders Community',
];

const phases = [
  HackathonPhaseName.LAUNCH,
  HackathonPhaseName.REGISTRATION,
  HackathonPhaseName.IN_PROGRESS,
  HackathonPhaseName.EVALUATION,
  HackathonPhaseName.FINISHED,
];

function requirePassword(name: string): string {
  const password = process.env[name];

  if (!password || password.length < 12) {
    throw new Error(`${name} must contain at least 12 characters`);
  }

  return password;
}

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

async function seedUser(
  manager: EntityManager,
  username: string,
  email: string,
  fullName: string,
  password: string,
  roleName: RoleName,
): Promise<User> {
  const userRepository = manager.getRepository(User);
  const roleRepository = manager.getRepository(UserRole);

  const role = await roleRepository.findOne({
    where: { role_name: roleName },
  });

  if (!role) {
    throw new Error(`Missing role ${roleName}. Run migrations first.`);
  }

  const existing = await userRepository.findOne({
    where: [{ username }, { email }],
    relations: { role: true },
  });

  if (existing) {
    if (
      existing.username !== username ||
      existing.email !== email ||
      existing.role?.role_name !== roleName
    ) {
      throw new Error(
        `Conflicting development account: ${username} / ${email}`,
      );
    }

    const passwordMatches = await bcrypt.compare(
      password,
      existing.password_hash,
    );

    if (!passwordMatches) {
      existing.password_hash = await bcrypt.hash(password, 12);
      await userRepository.save(existing);

      console.log(`Updated password for: ${username}`);
    } else {
      console.log(`User already up to date: ${username}`);
    }

    return existing;
  }

  const user = userRepository.create({
    username,
    full_name: fullName,
    email,
    email_verified: true,
    password_hash: await bcrypt.hash(password, 12),
    otp_hash: null,
    otp_expires_at: null,
    role,
  });

  const savedUser = await userRepository.save(user);
  console.log(`Created ${roleName}: ${username}`);
  return savedUser;
}

async function seedHackathons(
  manager: EntityManager,
  devUser: User,
  devAdmin: User,
): Promise<number> {
  const hackathonRepository = manager.getRepository(Hackathon);
  const settingsRepository = manager.getRepository(HackathonSettings);
  const phaseRepository = manager.getRepository(HackathonPhase);
  const membershipRepository = manager.getRepository(HackathonUser);

  const now = Date.now();
  let created = 0;

  for (let index = 0; index < HACKATHON_COUNT; index++) {
    const theme = themes[index % themes.length];
    const format = formats[Math.floor(index / themes.length)];
    const title = `${SEED_PREFIX} ${theme} ${format}`;

    const activePhaseIndex = index % phases.length;
    const scheduleStart = now - (activePhaseIndex * 4 + 1) * DAY;

    let hackathon = await hackathonRepository.findOne({
      where: { title },
      relations: {
        settings: true,
        phases: true,
      },
    });

    if (!hackathon) {
      hackathon = await hackathonRepository.save(
        hackathonRepository.create({
          title,
          description:
            `${format} focused on ${theme.toLowerCase()}, ` +
            'collaboration, practical innovation and problem-solving.',
          organization_name: organizations[index % organizations.length],
          start_at: new Date(scheduleStart),
          end_at: new Date(scheduleStart + phases.length * 4 * DAY),
        }),
      );

      created++;
    }

    const organizer = index % 2 === 0 ? devUser : devAdmin;

    const existingMembership = await membershipRepository.findOne({
      where: {
        user: { id: organizer.id },
        hackathon: { id: hackathon.id },
      },
    });

    if (!existingMembership) {
      await membershipRepository.save(
        membershipRepository.create({
          user: organizer,
          hackathon,
          hack_role_name: HackRoleName.ORGANIZER,
        }),
      );
    }

    if (!hackathon.settings) {
      await settingsRepository.save(
        settingsRepository.create({
          min_team_members: 1,
          max_team_members: 5,
          files_limit: 3,
          file_max_size: 10 * 1024 * 1024,
          hackathon,
        }),
      );
    }

    const existingPhaseNames = new Set(
      (hackathon.phases ?? []).map((phase) => phase.phase_name),
    );

    const missingPhases = phases.flatMap((phaseName, phaseIndex) => {
      if (existingPhaseNames.has(phaseName)) {
        return [];
      }

      const phaseStart = hackathon.start_at.getTime() + phaseIndex * 4 * DAY;

      return [
        phaseRepository.create({
          phase_name: phaseName,
          description: `${phaseName.replace(/_/g, ' ')} phase`,
          start_at: new Date(phaseStart),
          end_at: new Date(phaseStart + 4 * DAY),
          hackathon,
        }),
      ];
    });

    if (missingPhases.length > 0) {
      await phaseRepository.save(missingPhases);
    }
  }

  return created;
}

async function main(): Promise<void> {
  assertDevelopmentEnvironment();

  const adminPassword = requirePassword('SEED_ADMIN_PASSWORD');
  const userPassword = requirePassword('SEED_USER_PASSWORD');

  await dataSource.initialize();

  try {
    const created = await dataSource.transaction(async (manager) => {
      const devAdmin = await seedUser(
        manager,
        'dev_admin',
        'dev-admin@example.test',
        'Development Administrator',
        adminPassword,
        RoleName.ROLE_ADMIN,
      );

      const devUser = await seedUser(
        manager,
        'dev_user',
        'dev-user@example.test',
        'Development User',
        userPassword,
        RoleName.ROLE_USER,
      );

      return seedHackathons(manager, devUser, devAdmin);
    });

    console.log(`Created ${created} development hackathons`);
    console.log('Development seeding completed successfully');
  } finally {
    await dataSource.destroy();
  }
}

void main().catch((error: unknown) => {
  console.error('Development seeding failed:', error);
  process.exitCode = 1;
});
