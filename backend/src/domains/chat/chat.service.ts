import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatRoom } from './entities/chat-room.entity';
import { Repository } from 'typeorm';
import { ChatMember } from './entities/chat-member.entity';
import { Message } from './entities/message.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatRoom)
    private readonly chatRoomRepository: Repository<ChatRoom>,
    @InjectRepository(ChatMember)
    private readonly chatMemberRepository: Repository<ChatRoom>,
    @InjectRepository(ChatRoom)
    private readonly messageRepository: Repository<Message>,
  ) {}
}
