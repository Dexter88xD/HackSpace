import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { HackathonUser } from '../../hackathons/entities/hackathon-user.entity';
import { Team } from '../../teams/entities/team.entity';
import { ScoringCriterion } from './scoring-criterion.entity';

@Entity('scores')
@Unique('UQ_scores_judge_team_criterion', ['judge', 'team', 'criterion'])
@Check('CHK_scores_range', '"score" >= 0 AND "score" <= 10')
export class Score {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'integer' })
  score!: number;

  @Column({ type: 'text', nullable: true })
  comment!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt!: Date;

  @ManyToOne(() => HackathonUser, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'judge_id' })
  judge!: HackathonUser;

  @ManyToOne(() => Team, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'team_id' })
  team!: Team;

  @ManyToOne(() => ScoringCriterion, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'criterion_id' })
  criterion!: ScoringCriterion;
}
