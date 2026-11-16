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
import { Team } from '../../teams/entities/team.entity';
import { StoredFile } from '../../../shared/files/entities/stored-file.entity';

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

  @Column({ name: 'organization_name' })
  organizationName!: string;

  @Column({ name: 'start_at', type: 'timestamp' })
  startAt!: Date;

  @Column({ name: 'end_at', type: 'timestamp' })
  endAt!: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt!: Date;

  @OneToMany(() => HackathonPhase, (phase) => phase.hackathon)
  phases!: HackathonPhase[];

  @OneToOne(() => HackathonSettings, (settings) => settings.hackathon)
  settings!: HackathonSettings;

  @OneToMany(() => HackathonUser, (hackathonUser) => hackathonUser.hackathon)
  hackathonUsers!: HackathonUser[];

  @OneToMany(() => Team, (team) => team.hackathon)
  teams!: Team[];

  @OneToMany(() => StoredFile, (file) => file.hackathon)
  files!: StoredFile[];
}
