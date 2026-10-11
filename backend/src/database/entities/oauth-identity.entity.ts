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
@Unique(['provider', 'provider_user_id'])
export class OAuthIdentity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'enum', enum: OAuthProvider })
  provider!: OAuthProvider;

  @Column()
  provider_user_id!: string;

  @ManyToOne(() => User, (user) => user.oauth_identities, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @CreateDateColumn()
  created_at!: Date;
}
