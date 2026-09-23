import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { UserProfile } from './user-profile.entity';

@Entity('user_skills')
export class UserSkill {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @ManyToOne(() => UserProfile, (user_profile) => user_profile.skills)
  user_profile!: UserProfile;
}
