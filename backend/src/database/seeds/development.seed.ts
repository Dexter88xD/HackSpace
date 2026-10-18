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
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Development seeding is disabled in production');
  }

  if (process.env.SEED_DEV_DATA !== 'true') {
    throw new Error('Set SEED_DEV_DATA=true to allow development seeding');
  }

  if (!process.env.POSTGRES_DB) {
    throw new Error('POSTGRES_DB must be configured');
  }
}

async function seedUser(
  manager: EntityManager,
  username: string,
  email: string,
  fullName: string,
  password: string,
  roleName: RoleName,
): Promise<void> {
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

    console.log(`User already exists: ${username}`);
    return;
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

  await userRepository.save(user);
  console.log(`Created ${roleName}: ${username}`);
}

async function seedHackathons(manager: EntityManager): Promise<number> {
  const hackathonRepository = manager.getRepository(Hackathon);
  const settingsRepository = manager.getRepository(HackathonSettings);
  const phaseRepository = manager.getRepository(HackathonPhase);

  const existing = await hackathonRepository.find({
    select: { title: true },
  });

  const existingTitles = new Set(existing.map((item) => item.title));
  const now = Date.now();

  let created = 0;

  for (let index = 0; index < HACKATHON_COUNT; index++) {
    const theme = themes[index % themes.length];
    const format = formats[Math.floor(index / themes.length)];
    const title = `${SEED_PREFIX} ${theme} ${format}`;

    if (existingTitles.has(title)) {
      continue;
    }

    // Rotate the currently active phase across the five phase types.
    const activePhaseIndex = index % phases.length;

    // Each phase lasts four days.
    const scheduleStart = now - (activePhaseIndex * 4 + 1) * DAY;

    const hackathon = hackathonRepository.create({
      title,
      description:
        `${format} focused on ${theme.toLowerCase()}, ` +
        'collaboration, practical innovation and problem-solving.',
      organization_name: organizations[index % organizations.length],
      start_at: new Date(scheduleStart),
      end_at: new Date(scheduleStart + phases.length * 4 * DAY),
    });

    const savedHackathon = await hackathonRepository.save(hackathon);

    const settings = settingsRepository.create({
      min_team_members: 1,
      max_team_members: 5,
      files_limit: 3,
      file_max_size: 10 * 1024 * 1024,
      hackathon: savedHackathon,
    });

    await settingsRepository.save(settings);

    const scheduledPhases = phases.map((phaseName, phaseIndex) => {
      const phaseStart = scheduleStart + phaseIndex * 4 * DAY;

      return phaseRepository.create({
        phase_name: phaseName,
        description: `${phaseName.replace(/_/g, ' ')} phase`,
        start_at: new Date(phaseStart),
        end_at: new Date(phaseStart + 4 * DAY),
        hackathon: savedHackathon,
      });
    });

    await phaseRepository.save(scheduledPhases);

    created++;
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
      await seedUser(
        manager,
        'dev_admin',
        'dev-admin@example.test',
        'Development Administrator',
        adminPassword,
        RoleName.ROLE_ADMIN,
      );

      await seedUser(
        manager,
        'dev_user',
        'dev-user@example.test',
        'Development User',
        userPassword,
        RoleName.ROLE_USER,
      );

      return seedHackathons(manager);
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
