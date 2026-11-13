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
import { Skill } from '../../skills/entities/skill.entity';
import { StoredFile } from '../../../shared/files/entities/stored-file.entity';

@Entity('user_profiles')
export class UserProfile {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'text', nullable: true })
  bio!: string | null;

  @OneToOne(() => StoredFile, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({
    name: 'avatar_file_id',
    foreignKeyConstraintName: 'FK_user_profiles_avatar_file',
  })
  avatar!: StoredFile | null;

  @Column({ name: 'organization_name', type: 'varchar', nullable: true })
  organizationName!: string | null;

  @Column({ type: 'varchar', nullable: true })
  major!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToOne(() => User, (user) => user.profile)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToMany(() => Skill, (skill) => skill.profiles)
  @JoinTable({
    name: 'user_profile_skills',
    joinColumn: {
      name: 'profile_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'skill_id',
      referencedColumnName: 'id',
    },
  })
  skills!: Skill[];
}
