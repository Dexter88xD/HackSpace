import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '../database/entities/user.entity';
import { UserProfile } from '../database/entities/user-profile.entity';

import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserProfile])],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
