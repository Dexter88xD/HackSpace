import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';
import { ChatRoom } from './chat-room.entity';
import { User } from '../../users/entities/user.entity';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 4000 })
  content!: string;

  @CreateDateColumn({ type: 'timestamp', name: 'sent_at' })
  sentAt!: Date;

  @ManyToOne(() => ChatRoom, (chatRoom) => chatRoom.messages, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'chat_room_id' })
  chatRoom!: ChatRoom;

  @ManyToOne(() => User, (user) => user.messages, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'sender_id' })
  sender!: User | null;
}
