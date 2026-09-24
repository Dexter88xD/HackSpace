import { config as loadEnv } from 'dotenv';
import { DataSource } from 'typeorm';
import { User } from './entities/user.entity';
import { UserRole } from './entities/user-role.entity';
import { UserProfile } from './entities/user-profile.entity';
import { UserSkill } from './entities/user-skill.entity';

loadEnv({ path: '../.env' });

export default new DataSource({
	type: 'postgres',
	host: process.env.DB_HOST ?? 'localhost',
	port: Number(process.env.DB_PORT ?? process.env.POSTGRES_PORT ?? 5432),
	username: process.env.DB_USERNAME ?? process.env.POSTGRES_USER,
	password: process.env.DB_PASSWORD ?? process.env.POSTGRES_PASSWORD,
	database: process.env.DB_DATABASE ?? process.env.POSTGRES_DB,

	entities: [
		User,
		UserRole,
		UserProfile,
		UserSkill,
	],

	migrations: [
		__dirname + '/migrations/*{.ts,.js}',
	],
});