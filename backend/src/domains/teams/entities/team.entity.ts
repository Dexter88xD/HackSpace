import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Hackathon } from '../../hackathons/entities/hackathon.entity';
import { TeamMember } from './team-member.entity';
import { ChatRoom } from '../../chat/entities/chat-room.entity';

// Two teams in the same hackathon cannot share a name.
@Unique('UQ_teams_hackathon_name', ['hackathon', 'name'])
@Entity('teams')
export class Team {
  @PrimaryGeneratedColumn({ primaryKeyConstraintName: 'PK_teams' })
  id!: number;

  @Column({ length: 50 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @ManyToOne(() => Hackathon, (hackathon) => hackathon.teams, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'hackathon_id' })
  hackathon!: Hackathon;

  @OneToMany(() => TeamMember, (member) => member.team)
  members!: TeamMember[];

  @OneToOne(() => ChatRoom, (chatRoom) => chatRoom.team)
  chatRoom!: ChatRoom;
}
