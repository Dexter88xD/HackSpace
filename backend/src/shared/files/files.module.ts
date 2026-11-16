import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { S3Module } from 'nestjs-s3';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import {
  FILE_PUBLIC_ENDPOINT,
  FileManager,
  MAX_FILE_UPLOAD_BYTES,
} from './file-manager';
import { S3FileManager } from './s3-file-manager';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StoredFile } from './entities/stored-file.entity';
import { Hackathon } from '../../domains/hackathons/entities/hackathon.entity';
import { Team } from '../../domains/teams/entities/team.entity';
import { MulterModule } from '@nestjs/platform-express';

function maxFileUploadBytes(config: ConfigService): number {
  const limit = Number(config.getOrThrow<number>(MAX_FILE_UPLOAD_BYTES));
  if (!Number.isSafeInteger(limit) || limit <= 0) {
    throw new Error('MAX_FILE_UPLOAD_BYTES must be a positive integer');
  }
  return limit;
}

function storageConnection(connection?: string) {
  return S3Module.forRootAsync(
    {
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        config: {
          endpoint:
            connection === 'public'
              ? config.getOrThrow<string>('MINIO_PUBLIC_ENDPOINT')
              : config.getOrThrow<string>('MINIO_ENDPOINT'),
          region: 'us-east-1',
          forcePathStyle: true,
          credentials: {
            accessKeyId: config.getOrThrow<string>('MINIO_ROOT_USER'),
            secretAccessKey: config.getOrThrow<string>('MINIO_ROOT_PASSWORD'),
          },
        },
      }),
    },
    connection,
  );
}

@Module({
  imports: [
    ConfigModule,
    MulterModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        limits: {
          fileSize: maxFileUploadBytes(config),
        },
      }),
    }),
    TypeOrmModule.forFeature([StoredFile, Hackathon, Team]),
    storageConnection(),
    storageConnection('public'),
  ],
  controllers: [FilesController],
  exports: [FileManager],
  providers: [
    FilesService,
    { provide: FileManager, useClass: S3FileManager },
    {
      provide: MAX_FILE_UPLOAD_BYTES,
      inject: [ConfigService],
      useFactory: maxFileUploadBytes,
    },
    {
      provide: FILE_PUBLIC_ENDPOINT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        config.getOrThrow<string>('MINIO_PUBLIC_ENDPOINT'),
    },
  ],
})
export class FilesModule {}
