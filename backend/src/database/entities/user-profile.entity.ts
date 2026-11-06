import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  JoinTable,
  ManyToMany,
} from 'typeorm';

import { User } from './user.entity';
import { Skill } from '../../domains/skills/entities/skill.entity';

@Entity('user_profiles')
export class UserProfile {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', nullable: true })
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

  @ManyToMany(() => Skill, (skill) => skill.profiles)
  @JoinTable({
    name: 'user_profile_skills',
    joinColumn: { name: 'profile_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'skill_id', referencedColumnName: 'id' },
  })
  skills!: Skill[];
}
