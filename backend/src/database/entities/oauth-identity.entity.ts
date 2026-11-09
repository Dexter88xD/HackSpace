import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { User } from './user.entity';

export enum OAuthProvider {
  GOOGLE = 'google',
  INTRA42 = '42',
}

@Entity('oauth_identities')
@Unique('UQ_oauth_provider_user', ['provider', 'providerUserId'])
export class OAuthIdentity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'enum', enum: OAuthProvider })
  provider!: OAuthProvider;

  @Column({ name: 'provider_user_id' })
  providerUserId!: string;

  @ManyToOne(() => User, (user) => user.oauthIdentities, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
