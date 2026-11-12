import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { S3Module } from 'nestjs-s3';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { FileManager } from './file-manager';
import { S3FileManager } from './s3-file-manager';

@Module({
  imports: [
    S3Module.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        config: {
          endpoint: config.get<string>('MINIO_ENDPOINT', 'http://minio:9000'),
          region: 'us-east-1',
          forcePathStyle: true,
          credentials: {
            accessKeyId: config.getOrThrow<string>('MINIO_ROOT_USER'),
            secretAccessKey: config.getOrThrow<string>('MINIO_ROOT_PASSWORD'),
          },
        },
      }),
    }),
  ],
  controllers: [FilesController],
  providers: [FilesService, { provide: FileManager, useClass: S3FileManager }],
})
export class FilesModule {}
