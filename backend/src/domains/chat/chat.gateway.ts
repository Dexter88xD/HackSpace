import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WsException,
} from '@nestjs/websockets';
import { Namespace } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { parse } from 'cookie';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import type { AuthenticatedSocket } from './interfaces/socket.interface';
import { JoinRoomDto } from './dto/join-room.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatMember } from './entities/chat-member.entity';
import { Repository } from 'typeorm';

@WebSocketGateway({
  namespace: '/chat',
  cors: {
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  },
})
export class ChatGateWay
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(ChatMember)
    private readonly chatMembershipRepository: Repository<ChatMember>,
  ) {}

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
    console.log(`Cliend connected ${client.id}`);
  }
  handleDisconnect(client: AuthenticatedSocket) {
    console.log(`Client Disconnected ${client.id}`);
  }

  @SubscribeMessage('join-chat')
  async handleJoinRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: JoinRoomDto,
  ) {
    const usedId = client.data.user?.sub;

    const membership = await this.chatMembershipRepository.findOne({
      where: {
        user: { id: usedId },
        chatRoom: { id: data.chatRoomId },
      },
    });

    if (!membership) {
      throw new WsException('You are not a member of this chat room');
    }

    await client.join(`chat:${data.chatRoomId}`);

    return {
      event: 'joined-room',
      data: {
        chatRoomid: data.chatRoomId,
      },
    };
  }
}
