import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Team } from './team.entity';

@Entity('team_submissions')
export class TeamSubmission {
  @PrimaryColumn({ name: 'team_id', type: 'integer' })
  teamId!: number;

  @Column({ name: 'hackathon_id', type: 'integer' })
  hackathonId!: number;

  @ManyToOne(() => Team, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn([
    {
      name: 'team_id',
      referencedColumnName: 'id',
      foreignKeyConstraintName: 'FK_team_submissions_team_hackathon',
    },
    { name: 'hackathon_id', referencedColumnName: 'hackathonId' },
  ])
  team!: Team;

  @Column({ name: 'submitted_at', type: 'timestamptz', nullable: true })
  submittedAt!: Date | null;

  get isSubmitted(): boolean {
    return this.submittedAt !== null;
  }
}
