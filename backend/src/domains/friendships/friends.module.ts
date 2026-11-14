import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { Friendship } from './entities/friend.entity'
import { FriendsService } from './friends.service'
import { User } from '../users/entities/user.entity'


@Module({
    imports: [TypeOrmModule.forFeature([Friendship, User])],
    providers: [FriendsService],
    exports: [FriendsService],
})
export class FriendsModule {}