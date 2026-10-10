import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { HackathonPhase } from './hackathon-phase.entity';

@Entity('hackathons')
export class Hackathon {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  title!: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  description!: string | null;

  @Column()
  organization_name!: string;

  @Column({ type: 'timestamp' })
  start_at!: Date;

  @Column({ type: 'timestamp' })
  end_at!: Date;

  @CreateDateColumn({ type: 'timestamp' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at!: Date;

  @OneToMany(() => HackathonPhase, (phase) => phase.hackathon)
  phases!: HackathonPhase[];
}
