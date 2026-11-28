import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Friendship } from './entities/friendship.entity';
import { FriendshipsService } from './friendships.service';
import { User } from '../users/entities/user.entity';
import { FriendshipsController } from './friendships.controller';
import { ChatModule } from '../chat/chat.module';
import { ChatMember } from '../chat/entities/chat-member.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Friendship, User, ChatMember]),
    forwardRef(() => ChatModule),
  ],
  controllers: [FriendshipsController],
  providers: [FriendshipsService],
  exports: [FriendshipsService],
})
export class FriendshipsModule {}
