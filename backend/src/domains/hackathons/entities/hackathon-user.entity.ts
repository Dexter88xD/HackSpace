import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
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
    name: 'hack_role_name',
    type: 'enum',
    enum: HackRoleName,
    enumName: 'hackathon_role_name_enum',
    default: HackRoleName.PARTICIPANT,
  })
  hackRoleName!: HackRoleName;

  @ManyToOne(() => User, (user) => user.hackathonUsers, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Hackathon, (hackathon) => hackathon.hackathonUsers, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'hackathon_id' })
  hackathon!: Hackathon;
}
