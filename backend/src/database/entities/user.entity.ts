import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  ManyToOne,
} from 'typeorm';

import { UserProfile } from './user-profile.entity';
import { UserRole } from './user-role.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  username!: string;

  @Column()
  full_name!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ default: false })
  email_verified!: boolean;

  @Column()
  password_hash!: string;

  @Column({ type: 'varchar', nullable: true })
  otp_hash!: string | null;

  @Column({ type: 'timestamp', nullable: true })
  otp_expires_at!: Date | null;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @OneToOne(() => UserProfile, (profile) => profile.user)
  profile!: UserProfile;

  @ManyToOne(() => UserRole, (role) => role.users)
  role!: UserRole;
}
