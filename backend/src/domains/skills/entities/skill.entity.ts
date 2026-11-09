import {
  Column,
  Entity,
  Index,
  ManyToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserProfile } from '../../../database/entities/user-profile.entity';

@Entity('user_skills')
export class Skill {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 50 })
  name!: string;

  @Index('UQ_user_skills_normalized_name', { unique: true })
  @Column({ name: 'normalized_name', length: 50 })
  normalizedName!: string;

  @ManyToMany(() => UserProfile, (userProfile) => userProfile.skills, {
    onDelete: 'CASCADE',
  })
  profiles!: UserProfile[];
}
