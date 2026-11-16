import * as bcrypt from 'bcrypt';
import { EntityManager } from 'typeorm';
import { User } from '../../domains/users/entities/user.entity';
import { UserProfile } from '../../domains/users/entities/user-profile.entity';
import {
  RoleName,
  UserRole,
} from '../../domains/users/entities/user-role.entity';

const accounts = [
  {
    username: 'dev_admin',
    email: 'dev-admin@example.test',
    fullName: 'Development Administrator',
    role: RoleName.ROLE_ADMIN,
    bio: 'Helping the developer community build together.',
    organization: 'HackSpace',
    major: 'Community Management',
  },
  {
    username: 'dev_user',
    email: 'dev-user@example.test',
    fullName: 'Development User',
    role: RoleName.ROLE_USER,
    bio: 'Building practical open source projects.',
    organization: 'Open Source Collective',
    major: 'Software Engineering',
  },
  {
    username: 'dev_user_1',
    email: 'dev-user-1@example.test',
    fullName: 'Amal Frontend',
    role: RoleName.ROLE_USER,
    bio: 'Creating accessible web experiences.',
    organization: 'Atlas Innovation',
    major: 'Web Development',
  },
  {
    username: 'dev_user_2',
    email: 'dev-user-2@example.test',
    fullName: 'Youssef Backend',
    role: RoleName.ROLE_USER,
    bio: 'Designing reliable APIs and services.',
    organization: 'Digital Future Lab',
    major: 'Computer Science',
  },
  {
    username: 'dev_user_3',
    email: 'dev-user-3@example.test',
    fullName: 'Salma Data',
    role: RoleName.ROLE_USER,
    bio: 'Turning data into useful insights.',
    organization: 'Data Builders Community',
    major: 'Data Science',
  },
  {
    username: 'dev_user_4',
    email: 'dev-user-4@example.test',
    fullName: 'Omar Platform',
    role: RoleName.ROLE_USER,
    bio: 'Automating infrastructure and deployments.',
    organization: 'Campus Innovation Network',
    major: 'Cloud Engineering',
  },
  {
    username: 'dev_user_5',
    email: 'dev-user-5@example.test',
    fullName: 'Lina Design',
    role: RoleName.ROLE_USER,
    bio: 'Connecting user research with thoughtful design.',
    organization: 'Green Technology Alliance',
    major: 'Interaction Design',
  },
];

function requirePassword(name: string): string {
  const password = process.env[name];
  if (!password || password.length < 12) {
    throw new Error(`${name} must contain at least 12 characters`);
  }
  return password;
}

export async function seedUsers(
  manager: EntityManager,
): Promise<Map<string, User>> {
  const userRepository = manager.getRepository(User);
  const profileRepository = manager.getRepository(UserProfile);
  const roleRepository = manager.getRepository(UserRole);
  const users = new Map<string, User>();
  let created = 0;
  let profilesCreated = 0;

  for (const account of accounts) {
    const role = await roleRepository.findOneBy({ roleName: account.role });
    if (!role) {
      throw new Error(`Missing role ${account.role}. Run migrations first.`);
    }
    const matches = await userRepository.find({
      where: [{ username: account.username }, { email: account.email }],
      relations: { role: true },
    });
    if (
      matches.some(
        (user) =>
          user.username !== account.username ||
          user.email !== account.email ||
          user.role?.roleName !== account.role,
      )
    ) {
      throw new Error(
        `Conflicting development account: ${account.username} / ${account.email}`,
      );
    }
    let user = matches[0];
    if (!user) {
      const password = requirePassword(
        account.role === RoleName.ROLE_ADMIN
          ? 'SEED_ADMIN_PASSWORD'
          : 'SEED_USER_PASSWORD',
      );
      user = await userRepository.save(
        userRepository.create({
          username: account.username,
          email: account.email,
          fullName: account.fullName,
          emailVerified: true,
          passwordHash: await bcrypt.hash(password, 12),
          otpHash: null,
          otpExpiresAt: null,
          role,
        }),
      );
      created++;
    }
    const profile = await profileRepository.findOneBy({
      user: { id: user.id },
    });
    if (!profile) {
      await profileRepository.save(
        profileRepository.create({
          user,
          bio: account.bio,
          avatar: null,
          organizationName: account.organization,
          major: account.major,
        }),
      );
      profilesCreated++;
    }
    users.set(account.username, user);
  }
  console.log(
    `Users: ${created} created, ${accounts.length - created} skipped`,
  );
  console.log(
    `Profiles: ${profilesCreated} created, ${accounts.length - profilesCreated} skipped`,
  );
  return users;
}
