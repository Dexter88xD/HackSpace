import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { ChatRoom } from './entities/chat-room.entity';
import { Hackathon } from '../hackathons/entities/hackathon.entity';
import { ChatMember } from './entities/chat-member.entity';
import { Message } from './entities/message.entity';
import { ChatService } from './chat.service';
import { Team } from '../teams/entities/team.entity';
import { ChatGateWay } from './chat.gateway';
import { AuthModule } from '../auth/auth.module';
import { ChatController } from './chat.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      ChatRoom,
      ChatMember,
      Message,
      Hackathon,
      Team,
    ]),
    AuthModule,
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatGateWay],
  exports: [ChatGateWay],
})
export class ChatModule {}
