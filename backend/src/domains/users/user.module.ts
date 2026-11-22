import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { User } from './entities/user.entity';
import { UserProfile } from './entities/user-profile.entity';

import { UserController } from './user.controller';
import { UserService } from './user.service';
import { StoredFile } from '../../shared/files/entities/stored-file.entity';
import { FilesModule } from '../../shared/files/files.module';
import { MulterModule } from '@nestjs/platform-express';
import { MAX_FILE_UPLOAD_BYTES } from '../../shared/files/file-manager';

function maxFileUploadBytes(config: ConfigService): number {
  const limit = Number(config.getOrThrow<number>(MAX_FILE_UPLOAD_BYTES));
  if (!Number.isSafeInteger(limit) || limit <= 0) {
    throw new Error('MAX_FILE_UPLOAD_BYTES must be a positive integer');
  }
  return limit;
}

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserProfile, StoredFile]),
    FilesModule,
    ConfigModule,
    MulterModule.registerAsync({
      imports: [ConfigModule, FilesModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        limits: {
          fileSize: maxFileUploadBytes(config),
        },
      }),
    }),
  ],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
