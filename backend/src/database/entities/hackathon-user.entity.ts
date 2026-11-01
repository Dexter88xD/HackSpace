import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from './user.entity';
import { Hackathon } from './hackathon.entity';

export enum HackRoleName {
  ORGANIZER = 'ORGANIZER',
  PARTICIPANT = 'PARTICIPANT',
  JURY = 'JURY',
  MENTOR = 'MENTOR',
}

@Entity('hackathon_users')
@Unique('UQ_hackathon_users_user_hackathon', ['user', 'hackathon'])
export class HackathonUser {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    type: 'enum',
    enum: HackRoleName,
    enumName: 'hackathon_role_name_enum',
  })
  hack_role_name!: HackRoleName;

  @ManyToOne(() => User, (user) => user.hackathon_users, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Hackathon, (hackathon) => hackathon.hackathon_users, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'hackathon_id' })
  hackathon!: Hackathon;
}
