import { config as loadEnv } from 'dotenv';
import { DataSource } from 'typeorm';
import { User } from './entities/user.entity';
import { UserRole } from './entities/user-role.entity';
import { UserProfile } from './entities/user-profile.entity';
import { Skill } from '../domains/skills/entities/skill.entity';
import { Hackathon } from './entities/hackathon.entity';
import { OAuthIdentity } from './entities/oauth-identity.entity';
import { HackathonPhase } from './entities/hackathon-phase.entity';
import { HackathonSettings } from './entities/hackathon-settings.entity';
import { HackathonUser } from './entities/hackathon-user.entity';

loadEnv({ path: '../.env', quiet: true });

export default new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST,
  port: Number(process.env.POSTGRES_PORT),
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,

  entities: [
    User,
    UserRole,
    UserProfile,
    Skill,
    OAuthIdentity,
    Hackathon,
    HackathonPhase,
    HackathonSettings,
    HackathonUser,
  ],

  migrations: [__dirname + '/migrations/*{.ts,.js}'],
});
