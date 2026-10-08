import {
  Check,
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Hackathon } from './hackathon.entity';

@Check(`"min_team_members" >= 1 AND "max_team_members" >= "min_team_members"`)
@Check(`"additional_files_limit" >= 0 AND "file_max_size" >= 0`)
@Entity('hackathon_settings')
export class HackathonSettings {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  min_team_members!: number;

  @Column()
  max_team_members!: number;

  @Column({ default: false })
  additional_file!: boolean;

  @Column({ default: 0 })
  additional_files_limit!: number;

  @Column({ default: 0 })
  file_max_size!: number;

  @OneToOne(() => Hackathon, (hackathon) => hackathon.settings, {
    nullable: false,
  })
  @JoinColumn({ name: 'hackathonId' })
  hackathon!: Hackathon;
}
