import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatRoom } from './entities/chat-room.entity';
import { ChatMember } from './entities/chat-member.entity';
import { Message } from './entities/message.entity';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { AuthModule } from '../auth/auth.module';
import { ChatController } from './chat.controller';
import { PresenceService } from './presence.service';
import { FriendshipsModule } from '../friendships/friendships.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatRoom, ChatMember, Message]),
    AuthModule,
    forwardRef(() => FriendshipsModule),
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway, PresenceService],
  exports: [ChatGateway, PresenceService],
})
export class ChatModule {}
