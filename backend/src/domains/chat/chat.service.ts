import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatRoom } from './entities/chat-room.entity';
import { Repository } from 'typeorm';
import { ChatMember } from './entities/chat-member.entity';
import { Message } from './entities/message.entity';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatRoom)
    private readonly chatRoomRepository: Repository<ChatRoom>,
    @InjectRepository(ChatMember)
    private readonly chatMemberRepository: Repository<ChatMember>,
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
  ) {}

  async createMessage(userId: number, chatRoomId: number, content: string) {
    const membership = await this.chatMemberRepository.findOne({
      where: {
        user: { id: userId },
        chatRoom: { id: chatRoomId },
      },
    });

    if (!membership) {
      throw new WsException('You are not a member of this chat room');
    }

    if (!content.trim()) {
      throw new WsException('Message cannot be empty');
    }

    const message = this.messageRepository.create({
      content: content.trim(),
      sender: { id: userId },
      chatRoom: { id: chatRoomId },
    });

    return this.messageRepository.save(message);
  }

  async getMessages(userId: number, chatRoomId: number) {
    const membership = await this.chatMemberRepository.findOne({
      where: {
        user: { id: userId },
        chatRoom: { id: chatRoomId },
      },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member in the chat room');
    }

    return this.messageRepository.find({
      where: {
        chatRoom: { id: chatRoomId },
      },
      relations: {
        sender: true,
      },
      select: {
        id: true,
        content: true,
        sentAt: true,
        sender: {
          id: true,
          username: true,
        },
      },
      order: {
        sentAt: 'ASC',
      },
    });
  }
}
