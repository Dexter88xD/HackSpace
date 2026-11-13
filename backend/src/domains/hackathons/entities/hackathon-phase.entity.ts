import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Check,
  Unique,
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
@Unique('UQ_hackathon_phase_name', ['hackathon', 'phaseName'])
@Entity('hackathon_phases')
export class HackathonPhase {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    type: 'enum',
    enum: HackathonPhaseName,
    name: 'phase_name',
  })
  phaseName!: HackathonPhaseName;

  @Column({
    type: 'text',
    nullable: true,
  })
  description!: string | null;

  @Column({ name: 'start_at', type: 'timestamp' })
  startAt!: Date;

  @Column({ name: 'end_at', type: 'timestamp' })
  endAt!: Date;

  @ManyToOne(() => Hackathon, (hackathon) => hackathon.phases, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'hackathon_id' })
  hackathon!: Hackathon;
}
