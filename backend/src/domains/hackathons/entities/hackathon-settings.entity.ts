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
@Check(`"files_limit" >= 0 AND "file_max_size" >= 0`)
@Entity('hackathon_settings')
export class HackathonSettings {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'min_team_members' })
  minTeamMembers: number = 1;

  @Column({ name: 'max_team_members' })
  maxTeamMembers: number = 5;

  @Column({ name: 'files_limit', default: 0 })
  filesLimit: number = 0;

  @Column({ name: 'file_max_size', default: 0 })
  fileMaxSize: number = 0;

  @OneToOne(() => Hackathon, (hackathon) => hackathon.settings, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'hackathon_id' })
  hackathon!: Hackathon;
}
