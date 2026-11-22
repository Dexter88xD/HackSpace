import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  PayloadTooLargeException,
  OnModuleInit,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectS3 } from 'nestjs-s3';
import type { S3 } from 'nestjs-s3';
import { GetObjectCommand, S3ServiceException } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import { Readable } from 'node:stream';
import { FileManager, MAX_FILE_UPLOAD_BYTES } from './file-manager';
import type { UploadFile } from './file-manager';
import { StoredFile } from './entities/stored-file.entity';
import { ALLOWED_FILE_TYPES } from './file-type';
import { Hackathon } from '../../domains/hackathons/entities/hackathon.entity';
import { Team } from '../../domains/teams/entities/team.entity';
import { FileBucket } from './file-bucket';

@Injectable()
export class S3FileManager extends FileManager implements OnModuleInit {
  private readonly logger = new Logger(S3FileManager.name);

  constructor(
    @InjectS3() private readonly s3: S3,
    @InjectRepository(StoredFile)
    private readonly files: Repository<StoredFile>,
    @InjectRepository(Hackathon)
    private readonly hackathons: Repository<Hackathon>,
    @InjectRepository(Team) private readonly teams: Repository<Team>,
    @InjectS3('public') private readonly publicS3: S3,
    @Inject(MAX_FILE_UPLOAD_BYTES) private readonly maxUploadBytes: number,
  ) {
    super();
  }

  async onModuleInit(): Promise<void> {
    for (const bucket of Object.values(FileBucket)) {
      try {
        await this.s3.headBucket({ Bucket: bucket });
      } catch (error) {
        const reason = error instanceof Error ? error.name : 'unknown error';
        throw new Error(
          `Cannot access MinIO bucket "${bucket}" (${reason}); check application credentials and run MinIO provisioning`,
          { cause: error },
        );
      }
    }
  }

  async delete(file: StoredFile): Promise<void> {
    await this.s3.deleteObject({
      Bucket: file.bucket,
      Key: file.storedName,
    });
    await this.files.delete(file.id);
  }

  async getStream(file: StoredFile): Promise<Readable> {
    try {
      const object = await this.s3.getObject({
        Bucket: file.bucket,
        Key: file.storedName,
      });
      if (!(object.Body instanceof Readable)) {
        throw new InternalServerErrorException('File stream is unavailable');
      }
      return object.Body;
    } catch (error) {
      if (
        error instanceof S3ServiceException &&
        error.$metadata.httpStatusCode === 404
      ) {
        throw new NotFoundException('File not found');
      }
      throw error;
    }
  }

  getFile(file: StoredFile): Promise<string> {
    return getSignedUrl(
      this.publicS3,
      new GetObjectCommand({
        Bucket: file.bucket,
        Key: file.storedName,
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
    const bucket = file.bucket ?? FileBucket.DEFAULT;
    if (!Object.values(FileBucket).includes(bucket)) {
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
    const key = `${id}${extname(file.originalname)}`;
    const storedFile = this.files.create({
      id,
      name: file.originalname,
      bucket,
      storedName: key,
      fileType: allowed.type,
      hackathon,
      team,
    });

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
