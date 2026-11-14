import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { Hackathon } from '../../../domains/hackathons/entities/hackathon.entity';
import { Team } from '../../../domains/teams/entities/team.entity';
import { FileType } from '../file-type';
import { FileBucket } from '../file-bucket';

@Entity('files')
export class StoredFile {
  @PrimaryColumn({ type: 'uuid', primaryKeyConstraintName: 'PK_files' })
  id!: string;

  @Column({ type: 'text' })
  name!: string;

  @Column({
    type: 'enum',
    enum: FileBucket,
    enumName: 'files_bucket_enum',
    default: FileBucket.DEFAULT,
  })
  bucket!: FileBucket;

  @Column({ type: 'text' })
  url!: string;

  @Column({
    name: 'file_type',
    type: 'enum',
    enum: FileType,
    enumName: 'files_file_type_enum',
  })
  fileType!: FileType;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @ManyToOne(() => Hackathon, (hackathon) => hackathon.files, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({
    name: 'hackathon_id',
    foreignKeyConstraintName: 'FK_files_hackathon',
  })
  hackathon!: Hackathon | null;

  @ManyToOne(() => Team, (team) => team.files, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'team_id', foreignKeyConstraintName: 'FK_files_team' })
  team!: Team | null;
}
