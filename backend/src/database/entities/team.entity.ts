import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Hackathon } from './hackathon.entity';
import { TeamMember } from './team-member.entity';

// Two teams in the same hackathon cannot share a name.
@Unique('UQ_teams_hackathon_name', ['hackathon', 'name'])
@Entity('teams')
export class Team {
  @PrimaryGeneratedColumn({ primaryKeyConstraintName: 'PK_teams' })
  id!: number;

  @Column({ length: 50 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  created_at!: Date;

  @ManyToOne(() => Hackathon, (hackathon) => hackathon.teams, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'hackathon_id',
    foreignKeyConstraintName: 'FK_teams_hackathon',
  })
  hackathon!: Hackathon;

  @OneToMany(() => TeamMember, (member) => member.team)
  members!: TeamMember[];
}
