import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  JoinColumn,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Check,
  Index,
} from 'typeorm';

import { User } from '../../users/entities/user.entity';

export enum FriendshipStatus {
  ACCEPTED = 'ACCEPTED',
  PENDING = 'PENDING',
}

@Entity('friendships')
@Check('CHK_friendships_not_self', '"requester_id" <> "addressee_id"')
@Check('CHK_friendships_status', "\"status\" IN ('PENDING', 'ACCEPTED')")
// Managed manually because it indexes LEAST(requester_id, addressee_id),
// GREATEST(requester_id, addressee_id); synchronization is disabled.
@Index('UQ_friendships_pair', { synchronize: false })
export class Friendship {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'requester_id', type: 'int' })
  requesterId!: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'requester_id' })
  requester!: User;

  @Column({ name: 'addressee_id', type: 'int' })
  addresseeId!: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'addressee_id' })
  addressee!: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @Column({ name: 'accepted_at', type: 'timestamptz', nullable: true })
  acceptedAt!: Date | null;

  @Column({ type: 'varchar', length: 20, default: FriendshipStatus.PENDING })
  status!: FriendshipStatus;
}
