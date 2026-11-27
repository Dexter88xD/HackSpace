import {
  Ack,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Namespace } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { parse } from 'cookie';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import type {
  AuthenticatedSocket,
  AuthenticatedSocketData,
} from './interfaces/socket.interface';
import { JoinRoomDto } from './dto/join-room.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatMember } from './entities/chat-member.entity';
import { Repository } from 'typeorm';
import { MessageDto } from './dto/message.dto';
import { ChatService } from './chat.service';
import { LeaveRoomDto } from './dto/leave-room.dto';
import { Message } from './entities/message.entity';
import { PresenceService } from './presence.service';

@WebSocketGateway({
  namespace: '/chat',
  cors: {
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  },
})
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private readonly jwtService: JwtService,
    private readonly chatService: ChatService,
    private readonly presenceService: PresenceService,
    @InjectRepository(ChatMember)
    private readonly chatMembershipRepository: Repository<ChatMember>,
  ) {}

  @WebSocketServer()
  server!: Namespace;

  afterInit(server: Namespace) {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    server.use(async (client: AuthenticatedSocket, next) => {
      try {
        const cookieHeader = client.handshake.headers.cookie;
        if (!cookieHeader) {
          return next(new Error('Unauthorized'));
        }

        const cookies = parse(cookieHeader);

        const token = cookies['accessToken'];

        if (!token) {
          return next(new Error('Unauthorized'));
        }

        const payload = await this.jwtService.verifyAsync<JwtPayload>(token);

        client.data.user = payload;
        next();
      } catch {
        next(new Error('Unauthorized'));
      }
    });
  }

  handleConnection(client: AuthenticatedSocket) {
    const userId = client.data.user?.sub;
    const isConnected = this.presenceService.addConnection(userId, client.id);
    if (isConnected) client.broadcast.emit('user-online', { userId });
  }

  handleDisconnect(client: AuthenticatedSocket) {
    const userId = client.data.user?.sub;
    const isDisconnected = this.presenceService.removeConnection(
      userId,
      client.id,
    );
    if (isDisconnected) client.broadcast.emit('user-offline', { userId });
  }

  @SubscribeMessage('join-chat')
  async handleJoinRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: JoinRoomDto,
    @Ack() ack: (response: { success: boolean; error?: string }) => void,
  ) {
    try {
      const userId = client.data.user?.sub;

      if (!userId) {
        throw new WsException('Unauthorized');
      }

      const membership = await this.chatMembershipRepository.findOne({
        where: {
          user: { id: userId },
          chatRoom: { id: data.chatRoomId },
        },
      });

      if (!membership) {
        throw new WsException('You are not a member of this chat room');
      }

      await client.join(`chat:${data.chatRoomId}`);

      ack({
        success: true,
      });
    } catch (error) {
      ack({
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to join chat room',
      });
    }
  }

  @SubscribeMessage('send-message')
  async handleMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: MessageDto,
    @Ack()
    ack: (response: {
      success: boolean;
      message?: Message;
      error?: string;
    }) => void,
  ) {
    try {
      const userId = client.data.user?.sub;

      if (!userId) {
        throw new WsException('Unauthorized');
      }

      const savedMessage = await this.chatService.createMessage(
        userId,
        data.chatRoomId,
        data.content,
      );

      this.server
        .to(`chat:${data.chatRoomId}`)
        .emit('new-message', savedMessage);

      ack({
        success: true,
        message: savedMessage,
      });
    } catch (error) {
      ack({
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to send message',
      });
    }
  }

  @SubscribeMessage('leave-chat')
  async handleLeaveChat(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: LeaveRoomDto,
  ) {
    await client.leave(`chat:${data.chatRoomId}`);
  }

  async removeUserFromRoom(userId: number, chatRoomId: number) {
    const room = `chat:${chatRoomId}`;

    const sockets = await this.server.in(room).fetchSockets();

    for (const socket of sockets) {
      const socketData = socket.data as AuthenticatedSocketData;
      if (socketData.user?.sub === userId) {
        socket.leave(room);
      }
    }
  }
}
