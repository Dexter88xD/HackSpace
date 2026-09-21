import { Entity, PrimaryGeneratedColumn, Column,
	CreateDateColumn, UpdateDateColumn,
	OneToOne, ManyToOne } from 'typeorm';

import { UserProfile } from './user-profile.entity';
import { UserRole } from './user-role.entity';

@Entity('users')
export class User {
	@PrimaryGeneratedColumn()
	id! : number;

	@Column({ unique : true })
	username! : string;

	@Column()
	first_name! : string;

	@Column()
	last_name! : string;

	@Column({ unique : true })
	email! : string;

	@Column()
	email_verified! : boolean;

	@Column()
	password_hash! : string;

	@Column()
	otp_hash! : string;

	@CreateDateColumn()
	otp_expires_at! : Date;

	@CreateDateColumn()
	created_at! : Date;

	@UpdateDateColumn()
	updated_at! : Date;

	@OneToOne(() => UserProfile, (profile) => profile.user)
	profile! : UserProfile;

	@ManyToOne(() => UserRole, (role) => role.user)
	role! : UserRole;
}