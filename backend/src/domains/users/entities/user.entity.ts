import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';

import { UserProfile } from './user-profile.entity';
import { UserRole } from './user-role.entity';
import { OAuthIdentity } from '../../auth/entities/oauth-identity.entity';
import { HackathonUser } from '../../hackathons/entities/hackathon-user.entity';
import { ChatMember } from '../../chat/entities/chat-member.entity';
import { Message } from '../../chat/entities/message.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  username!: string;

  @Column({ name: 'full_name' })
  fullName!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ name: 'email_verified', default: false })
  emailVerified: boolean = false;

  @Column({ name: 'password_hash' })
  passwordHash!: string;

  @Column({ name: 'otp_hash', type: 'varchar', nullable: true })
  otpHash!: string | null;

  @Column({ name: 'otp_expires_at', type: 'timestamp', nullable: true })
  otpExpiresAt!: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToOne(() => UserProfile, (profile) => profile.user)
  profile!: UserProfile;

  @ManyToOne(() => UserRole, (role) => role.users)
  @JoinColumn({ name: 'role_id' })
  role!: UserRole;

  @OneToMany(() => OAuthIdentity, (identity) => identity.user)
  oauthIdentities!: OAuthIdentity[];

  @OneToMany(() => HackathonUser, (hackathonUser) => hackathonUser.user)
  hackathonUsers!: HackathonUser[];

  @OneToMany(() => ChatMember, (chatMember) => chatMember.user)
  chatMemberships!: ChatMember[];

  @OneToMany(() => Message, (message) => message.sender)
  messages!: Message[];
}
