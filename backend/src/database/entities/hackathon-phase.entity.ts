import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Check,
  JoinColumn,
} from 'typeorm';
import { Hackathon } from './hackathon.entity';

export enum HackathonPhaseName {
  LAUNCH = 'LAUNCH',
  REGISTRATION = 'REGISTRATION',
  IN_PROGRESS = 'IN_PROGRESS',
  EVALUATION = 'EVALUATION',
  FINISHED = 'FINISHED',
}

@Check(`"start_at" < "end_at"`)
@Entity('hackathon_phases')
export class HackathonPhase {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    type: 'enum',
    enum: HackathonPhaseName,
  })
  phase_name!: HackathonPhaseName;

  @Column({
    type: 'text',
    nullable: true,
  })
  description!: string | null;

  @Column({ type: 'timestamp' })
  start_at!: Date;

  @Column({ type: 'timestamp' })
  end_at!: Date;

  @ManyToOne(() => Hackathon, (hackathon) => hackathon.phases, {
    nullable: false,
  })
  @JoinColumn({ name: 'hackathon_id' })
  hackathon!: Hackathon;
}
