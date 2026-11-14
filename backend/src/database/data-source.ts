import { config as loadEnv } from 'dotenv';
import { DataSource } from 'typeorm';
import { User } from '../domains/users/entities/user.entity';
import { UserRole } from '../domains/users/entities/user-role.entity';
import { UserProfile } from '../domains/users/entities/user-profile.entity';
import { Skill } from '../domains/skills/entities/skill.entity';
import { Hackathon } from '../domains/hackathons/entities/hackathon.entity';
import { OAuthIdentity } from '../domains/auth/entities/oauth-identity.entity';
import { HackathonPhase } from '../domains/hackathons/entities/hackathon-phase.entity';
import { HackathonSettings } from '../domains/hackathons/entities/hackathon-settings.entity';
import { HackathonUser } from '../domains/hackathons/entities/hackathon-user.entity';
import { Team } from '../domains/teams/entities/team.entity';
import { TeamMember } from '../domains/teams/entities/team-member.entity';
import { StoredFile } from '../shared/files/entities/stored-file.entity';

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
    Team,
    TeamMember,
    StoredFile,
  ],

  migrations: [__dirname + '/migrations/*{.ts,.js}'],
});
