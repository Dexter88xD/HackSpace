import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { HackathonUser } from '../../hackathons/entities/hackathon-user.entity';
import { Team } from './team.entity';

// A participant asking to join a team. A row only exists while the request
// is waiting: accepting, rejecting or cancelling it deletes the row.
// A user can have one request per team.
@Unique('UQ_team_join_requests_team_user', ['team', 'hackathonUser'])
@Entity('team_join_requests')
export class TeamJoinRequest {
  @PrimaryGeneratedColumn({ primaryKeyConstraintName: 'PK_team_join_requests' })
  id!: number;

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
