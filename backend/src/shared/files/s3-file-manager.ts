import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectS3 } from 'nestjs-s3';
import type { S3 } from 'nestjs-s3';
import { GetObjectCommand, S3ServiceException } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import {
  FILE_PUBLIC_ENDPOINT,
  FileManager,
  MAX_FILE_UPLOAD_BYTES,
} from './file-manager';
import type { UploadFile } from './file-manager';
import { StoredFile } from './entities/stored-file.entity';
import { ALLOWED_FILE_TYPES } from './file-type';
import { Hackathon } from '../../domains/hackathons/entities/hackathon.entity';
import { Team } from '../../domains/teams/entities/team.entity';

@Injectable()
export class S3FileManager extends FileManager {
  private readonly logger = new Logger(S3FileManager.name);

  constructor(
    @InjectS3() private readonly s3: S3,
    @InjectRepository(StoredFile)
    private readonly files: Repository<StoredFile>,
    @InjectRepository(Hackathon)
    private readonly hackathons: Repository<Hackathon>,
    @InjectRepository(Team) private readonly teams: Repository<Team>,
    @Inject(FILE_PUBLIC_ENDPOINT) private readonly publicEndpoint: string,
    @InjectS3('public') private readonly publicS3: S3,
    @Inject(MAX_FILE_UPLOAD_BYTES) private readonly maxUploadBytes: number,
  ) {
    super();
  }

  private objectKey(file: Pick<StoredFile, 'id' | 'name'>): string {
    return `${file.id}${extname(file.name)}`;
  }

  async delete(file: StoredFile): Promise<void> {
    await this.s3.deleteObject({
      Bucket: file.bucket,
      Key: this.objectKey(file),
    });
    await this.files.delete(file.id);
  }

  getFile(file: StoredFile): Promise<string> {
    return getSignedUrl(
      this.publicS3,
      new GetObjectCommand({
        Bucket: file.bucket,
        Key: this.objectKey(file),
      }),
      { expiresIn: 3600 },
    );
  }

  async upload(file: UploadFile): Promise<StoredFile> {
    if (file.buffer.length > this.maxUploadBytes) {
      throw new PayloadTooLargeException(
        `File exceeds the maximum upload size of ${this.maxUploadBytes} bytes`,
      );
    }
    const allowed =
      ALLOWED_FILE_TYPES[extname(file.originalname).toLowerCase()];
    if (!allowed || !allowed.mimeTypes.includes(file.mimetype.toLowerCase())) {
      throw new BadRequestException('Unsupported file type or MIME mismatch');
    }
    const bucket = file.bucket ?? 'default';
    if (
      !/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(bucket) ||
      bucket.includes('..') ||
      /^(\d{1,3}\.){3}\d{1,3}$/.test(bucket) ||
      /^(xn--|sthree-|amzn-s3-demo-)/.test(bucket) ||
      /(-s3alias|--ol-s3|\.mrap|--x-s3|--table-s3)$/.test(bucket)
    ) {
      throw new BadRequestException('Invalid bucket name');
    }

    let hackathon: Hackathon | null = null;
    let team: Team | null = null;
    if (file.hackathonId !== undefined) {
      hackathon = await this.hackathons.findOneBy({ id: file.hackathonId });
      if (!hackathon) throw new NotFoundException('Hackathon not found');
    }
    if (file.teamId !== undefined) {
      team = await this.teams.findOne({
        where: { id: file.teamId },
        relations: { hackathon: true },
      });
      if (!team) throw new NotFoundException('Team not found');
      if (hackathon && hackathon.id !== team.hackathon.id) {
        throw new BadRequestException(
          'Team does not belong to the specified hackathon',
        );
      }
      hackathon = team.hackathon;
    }

    const id = randomUUID();
    const key = this.objectKey({ id, name: file.originalname });
    const url = `${this.publicEndpoint.replace(/\/+$/, '')}/${encodeURIComponent(bucket)}/${encodeURIComponent(key)}`;
    const storedFile = this.files.create({
      id,
      name: file.originalname,
      bucket,
      url,
      fileType: allowed.type,
      hackathon,
      team,
    });

    try {
      await this.s3.headBucket({ Bucket: bucket });
    } catch (error) {
      if (
        !(error instanceof S3ServiceException) ||
        error.$metadata.httpStatusCode !== 404
      ) {
        throw error;
      }

      try {
        await this.s3.createBucket({ Bucket: bucket });
      } catch (error) {
        if (
          !(error instanceof S3ServiceException) ||
          error.name !== 'BucketAlreadyOwnedByYou'
        ) {
          throw error;
        }
      }
    }

    await this.s3.putObject({
      Bucket: bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    try {
      return await this.files.save(storedFile);
    } catch (error) {
      try {
        await this.s3.deleteObject({ Bucket: bucket, Key: key });
      } catch (cleanupError) {
        this.logger.error(
          'Failed to delete uploaded object after metadata save failed',
          cleanupError,
        );
      }
      throw error;
    }
  }
}
