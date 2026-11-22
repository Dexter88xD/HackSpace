import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Friendship } from './entities/friend.entity';
import { FriendsService } from './friends.service';
import { User } from '../users/entities/user.entity';
import { FriendsController } from './friends.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Friendship, User])],
  controllers: [FriendsController],
  providers: [FriendsService],
  exports: [FriendsService],
})
export class FriendsModule {}
