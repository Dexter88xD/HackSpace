import { Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	UpdateDateColumn,
	OneToMany,
	OneToOne, 
	JoinColumn } from 'typeorm'

import { User } from './user.entity'
import { UserSkill } from './user-skill.entity'

@Entity('user_profiles')
export class UserProfile {
	@PrimaryGeneratedColumn()
	id! : number;

	@Column({ nullable: true })
	bio! : string;

	@Column()
	avatar_url! : string;

	@Column()
	organization_name! : string;

	@Column()
	major! : string;

	@CreateDateColumn()
	created_at! : Date;

	@UpdateDateColumn()
	updated_at! : Date;

	@JoinColumn()
	@OneToOne(() => User, (user) => user.profile)
	user! : User;

	@OneToMany(() => UserSkill, (skill) => skill.user_profile)
	skills! : UserSkill[];
}