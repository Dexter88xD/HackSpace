import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { HackathonUser } from '../../hackathons/entities/hackathon-user.entity';
import { Team } from './team.entity';

export enum JoinRequestStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
}

// A registration asking to join a team. Answered requests are kept as
// history, so only one PENDING request per team and user is allowed.
@Index('UQ_team_join_requests_pending', ['team', 'hackathonUser'], {
  unique: true,
  where: `"status" = 'PENDING'`,
})
@Entity('team_join_requests')
export class TeamJoinRequest {
  @PrimaryGeneratedColumn({ primaryKeyConstraintName: 'PK_team_join_requests' })
  id!: number;

  @Column({
    type: 'enum',
    enum: JoinRequestStatus,
    enumName: 'team_join_request_status_enum',
    default: JoinRequestStatus.PENDING,
  })
  status!: JoinRequestStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @ManyToOne(() => Team, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'team_id' })
  team!: Team;

  @ManyToOne(() => HackathonUser, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'hackathon_user_id' })
  hackathonUser!: HackathonUser;
}
