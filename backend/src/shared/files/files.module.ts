import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { S3Module } from 'nestjs-s3';
import { FileManager, MAX_FILE_UPLOAD_BYTES } from './file-manager';
import { S3FileManager } from './s3-file-manager';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StoredFile } from './entities/stored-file.entity';
import { Hackathon } from '../../domains/hackathons/entities/hackathon.entity';
import { Team } from '../../domains/teams/entities/team.entity';

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
      useFactory: (config: ConfigService) => {
        const accessKeyId = config.getOrThrow<string>('MINIO_ACCESS_KEY');
        const secretAccessKey = config.getOrThrow<string>('MINIO_SECRET_KEY');
        if (!accessKeyId.trim() || !secretAccessKey.trim()) {
          throw new Error('MinIO application credentials must not be empty');
        }
        return {
          config: {
            endpoint:
              connection === 'public'
                ? config.getOrThrow<string>('MINIO_PUBLIC_ENDPOINT')
                : config.getOrThrow<string>('MINIO_ENDPOINT'),
            region: 'us-east-1',
            forcePathStyle: true,
            credentials: {
              accessKeyId,
              secretAccessKey,
            },
          },
        };
      },
    },
    connection,
  );
}

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([StoredFile, Hackathon, Team]),
    storageConnection(),
    storageConnection('public'),
  ],
  exports: [FileManager],
  providers: [
    { provide: FileManager, useClass: S3FileManager },
    {
      provide: MAX_FILE_UPLOAD_BYTES,
      inject: [ConfigService],
      useFactory: maxFileUploadBytes,
    },
  ],
})
export class FilesModule {}
