import {
  Column,
  Entity,
  OneToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { ChatMember } from './chat-member.entity';
import { Hackathon } from '../../hackathons/entities/hackathon.entity';
import { Message } from './message.entity';
import { Team } from '../../teams/entities/team.entity';

export enum ChatRoomType {
  PRIVATE = 'private',
  TEAM = 'team',
  GLOBAL = 'global',
}

@Entity('chat_rooms')
export class ChatRoom {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 50 })
  title!: string;

  @Column({
    type: 'enum',
    enum: ChatRoomType,
    enumName: 'chat_room_type_enum',
    name: 'chat_room_type',
  })
  chatRoomType!: ChatRoomType;

  @OneToMany(() => ChatMember, (member) => member.chatRoom)
  members!: ChatMember[];

  @ManyToOne(() => Hackathon, (hackathon) => hackathon.chatRooms, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'hackathon_id' })
  hackathon!: Hackathon | null;

  @OneToMany(() => Message, (message) => message.chatRoom)
  messages!: Message[];

  @OneToOne(() => Team, (team) => team.chatRoom, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'team_id' })
  team!: Team | null;
}
