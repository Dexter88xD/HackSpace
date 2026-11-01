import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
  Check,
} from 'typeorm';
import { HackathonPhase } from './hackathon-phase.entity';
import { HackathonSettings } from './hackathon-settings.entity';
import { HackathonUser } from './hackathon-user.entity';

@Check('"start_at" < "end_at"')
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

  @OneToOne(() => HackathonSettings, (settings) => settings.hackathon)
  settings!: HackathonSettings;

  @OneToMany(() => HackathonUser, (hackathonUser) => hackathonUser.hackathon)
  hackathon_users!: HackathonUser[];
}
