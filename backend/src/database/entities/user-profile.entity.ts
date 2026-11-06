import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
  JoinColumn,
} from 'typeorm';

import { User } from './user.entity';
import { UserSkill } from './user-skill.entity';

@Entity('user_profiles')
export class UserProfile {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'text', nullable: true })
  bio!: string | null;

  @Column({ type: 'varchar', nullable: true })
  avatar_url!: string | null;

  @Column({ type: 'varchar', nullable: true })
  organization_name!: string | null;

  @Column({ type: 'varchar', nullable: true })
  major!: string | null;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @OneToOne(() => User, (user) => user.profile)
  @JoinColumn()
  user!: User;

  @OneToMany(() => UserSkill, (skill) => skill.user_profile)
  skills!: UserSkill[];
}
