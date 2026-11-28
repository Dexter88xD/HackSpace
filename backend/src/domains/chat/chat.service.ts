import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatMember } from './entities/chat-member.entity';
import { Message } from './entities/message.entity';
import { WsException } from '@nestjs/websockets';
import { FriendshipsService } from '../friendships/friendships.service';
import { ChatRoom, ChatRoomType } from './entities/chat-room.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ChatService {
  constructor(
    @Inject(forwardRef(() => FriendshipsService))
    private readonly friendshipsService: FriendshipsService,
    @InjectRepository(ChatMember)
    private readonly chatMemberRepository: Repository<ChatMember>,
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(ChatRoom)
    private readonly chatRoomRepository: Repository<ChatRoom>,
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

    const savedMessage = await this.messageRepository.save(message);

    return this.messageRepository.findOneOrFail({
      where: {
        id: savedMessage.id,
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
    });
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

  async getOrCreatePrivateChat(userId: number, friendId: number) {
    if (userId === friendId) {
      throw new BadRequestException('You cannot chat with yourself');
    }

    const areFriends = await this.friendshipsService.areFriends(
      userId,
      friendId,
    );

    if (!areFriends) {
      throw new ForbiddenException('You can only chat with friends');
    }

    return this.chatRoomRepository.manager.transaction(async (manager) => {
      await manager.getRepository(User).findOne({
        where: { id: Math.min(userId, friendId) },
        lock: { mode: 'pessimistic_write' },
      });
      const chatRoomRepository = manager.getRepository(ChatRoom);
      const chatMemberRepository = manager.getRepository(ChatMember);

      const userMemberships = await chatMemberRepository.find({
        where: {
          user: { id: userId },
          chatRoom: {
            chatRoomType: ChatRoomType.PRIVATE,
          },
        },
        relations: {
          chatRoom: true,
        },
      });

      const friendMemberships = await chatMemberRepository.find({
        where: {
          user: { id: friendId },
          chatRoom: {
            chatRoomType: ChatRoomType.PRIVATE,
          },
        },
        relations: {
          chatRoom: true,
        },
      });

      const friendRoomsIds = new Set(
        friendMemberships.map((membership) => membership.chatRoom.id),
      );

      const commonRoom = userMemberships.find((membership) =>
        friendRoomsIds.has(membership.chatRoom.id),
      );

      if (commonRoom) {
        return commonRoom.chatRoom.id;
      }

      const newRoom = chatRoomRepository.create({
        title: `Chat room`,
        chatRoomType: ChatRoomType.PRIVATE,
      });

      const savedRoom = await chatRoomRepository.save(newRoom);

      const members = chatMemberRepository.create([
        {
          user: { id: userId },
          chatRoom: { id: savedRoom.id },
        },
        {
          user: { id: friendId },
          chatRoom: { id: savedRoom.id },
        },
      ]);

      await chatMemberRepository.save(members);

      return savedRoom.id;
    });
  }
}
