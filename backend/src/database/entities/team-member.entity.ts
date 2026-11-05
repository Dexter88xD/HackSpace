import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { HackathonUser } from './hackathon-user.entity';
import { Team } from './team.entity';

// A member is a hackathon registration (hackathon_users row) placed in a team.
// A registration belongs to one hackathon, so making it unique here means a
// user can be in at most one team per hackathon.
@Unique('UQ_team_members_hackathon_user', ['hackathon_user'])
@Entity('team_members')
export class TeamMember {
  @PrimaryGeneratedColumn({ primaryKeyConstraintName: 'PK_team_members' })
  id!: number;

  @CreateDateColumn({ type: 'timestamp' })
  joined_at!: Date;

  @ManyToOne(() => Team, (team) => team.members, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'team_id',
    foreignKeyConstraintName: 'FK_team_members_team',
  })
  team!: Team;

  @ManyToOne(() => HackathonUser, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'hackathon_user_id',
    foreignKeyConstraintName: 'FK_team_members_hackathon_user',
  })
  hackathon_user!: HackathonUser;
}
