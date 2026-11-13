import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from './entities/user.entity';
import { UserProfile } from './entities/user-profile.entity';

import { UserController } from './user.controller';
import { UserService } from './user.service';
import { StoredFile } from '../../shared/files/entities/stored-file.entity';
import { FilesModule } from '../../shared/files/files.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserProfile, StoredFile]),
    FilesModule,
  ],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
