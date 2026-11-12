import { ValidationPipe } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { StoredFile } from './entities/stored-file.entity';
import { Hackathon } from '../../domains/hackathons/entities/hackathon.entity';
import { Team } from '../../domains/teams/entities/team.entity';
import type { Server } from 'node:http';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import {
  FILE_PUBLIC_ENDPOINT,
  FileManager,
  MAX_FILE_UPLOAD_BYTES,
} from './file-manager';
import { S3FileManager } from './s3-file-manager';
import { getS3ConnectionToken } from 'nestjs-s3';
import { S3 } from '@aws-sdk/client-s3';

describe('FilesController', () => {
  let app: INestApplication;
  const publicS3 = new S3({
    endpoint: 'http://localhost:9000',
    region: 'us-east-1',
    forcePathStyle: true,
    credentials: { accessKeyId: 'test', secretAccessKey: 'test-secret' },
  });
  const s3 = {
    deleteObject: jest.fn().mockResolvedValue({}),
    headBucket: jest.fn().mockResolvedValue({}),
    createBucket: jest.fn().mockResolvedValue({}),
    putObject: jest.fn().mockResolvedValue({}),
  };

  const files = {
    findOneBy: jest.fn(),
    delete: jest.fn().mockResolvedValue({ affected: 1 }),
    create: jest.fn((data: Partial<StoredFile>) =>
      Object.assign(new StoredFile(), data),
    ),
    save: jest.fn((entity: StoredFile) => Promise.resolve(entity)),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    files.findOneBy.mockResolvedValue(null);
  });

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [FilesController],
      providers: [
        FilesService,
        { provide: FileManager, useClass: S3FileManager },
        { provide: getS3ConnectionToken(''), useValue: s3 },
        { provide: getS3ConnectionToken('public'), useValue: publicS3 },
        { provide: FILE_PUBLIC_ENDPOINT, useValue: 'http://localhost:9000' },
        { provide: MAX_FILE_UPLOAD_BYTES, useValue: 10 },
        { provide: getRepositoryToken(StoredFile), useValue: files },
        {
          provide: getRepositoryToken(Hackathon),
          useValue: { findOneBy: jest.fn().mockResolvedValue({ id: 42 }) },
        },
        {
          provide: getRepositoryToken(Team),
          useValue: {
            findOne: jest
              .fn()
              .mockResolvedValue({ id: 7, hackathon: { id: 42 } }),
          },
        },
      ],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    publicS3.destroy();
  });

  it('returns 413 for files larger than the configured limit', async () => {
    await request(app.getHttpServer() as Server)
      .post('/files/upload')
      .attach('file', Buffer.alloc(11), 'example.txt')
      .expect(413);
    expect(s3.putObject).not.toHaveBeenCalled();
    expect(files.save).not.toHaveBeenCalled();
  });

  it('deletes the file by UUID and returns an empty 204 response', async () => {
    const id = '2813bd63-e537-427a-a129-d23f24ab5148';
    files.findOneBy.mockResolvedValue(
      Object.assign(new StoredFile(), {
        id,
        name: 'example.txt',
        bucket: 'uploads',
      }),
    );
    const response = await request(app.getHttpServer() as Server)
      .delete(`/files/${id}`)
      .expect(204);
    expect(response.text).toBe('');
    expect(s3.deleteObject).toHaveBeenCalledWith({
      Bucket: 'uploads',
      Key: `${id}.txt`,
    });
    expect(files.delete).toHaveBeenCalledWith(id);
  });

  it('returns 404 for a missing file', async () => {
    await request(app.getHttpServer() as Server)
      .delete('/files/2813bd63-e537-427a-a129-d23f24ab5148')
      .expect(404);
    expect(s3.deleteObject).not.toHaveBeenCalled();
  });

  it('rejects invalid UUIDs before looking up files', async () => {
    await request(app.getHttpServer() as Server)
      .delete('/files/invalid')
      .expect(400);
    expect(files.findOneBy).not.toHaveBeenCalled();
  });

  it('accepts a multipart file and uses the default bucket', async () => {
    const response = await request(app.getHttpServer() as Server)
      .post('/files/upload')
      .attach('file', Buffer.from('example'), 'example.txt')
      .expect(201);

    const url = new URL((response.body as { url: string }).url);
    expect(url.origin).toBe('http://localhost:9000');
    expect(url.pathname).toMatch(/^\/default\/[0-9a-f-]{36}\.txt$/);
    expect(url.searchParams.get('X-Amz-Expires')).toBe('3600');
    expect(url.searchParams.get('X-Amz-Signature')).toBeTruthy();

    expect(s3.putObject).toHaveBeenCalledWith({
      Bucket: 'default',
      Key: url.pathname.slice('/default/'.length),
      Body: Buffer.from('example'),
      ContentType: 'text/plain',
    });
  });

  it('forwards the multipart bucket field', async () => {
    const response = await request(app.getHttpServer() as Server)
      .post('/files/upload')
      .field('bucket', 'uploads')
      .attach('file', Buffer.from('example'), 'example.txt')
      .expect(201);

    expect(new URL((response.body as { url: string }).url).pathname).toMatch(
      /^\/uploads\/[0-9a-f-]{36}\.txt$/,
    );

    expect(s3.headBucket).toHaveBeenCalledWith({ Bucket: 'uploads' });
  });

  it('transforms multipart parent IDs and persists the associations', async () => {
    await request(app.getHttpServer() as Server)
      .post('/files/upload')
      .field('hackathonId', '42')
      .field('teamId', '7')
      .attach('file', Buffer.from('example'), 'example.txt')
      .expect(201);

    expect(files.save).toHaveBeenCalledWith(
      expect.objectContaining({
        hackathon: { id: 42 },
        team: { id: 7, hackathon: { id: 42 } },
      }),
    );
  });

  it.each(['0', '-1', '1.5', 'abc', ''])(
    'rejects invalid parent ID %j before upload',
    async (id) => {
      for (const field of ['hackathonId', 'teamId']) {
        await request(app.getHttpServer() as Server)
          .post('/files/upload')
          .field(field, id)
          .attach('file', Buffer.from('example'), 'example.txt')
          .expect(400);
      }
      expect(s3.putObject).not.toHaveBeenCalled();
    },
  );

  it('rejects MIME mismatches before upload', async () => {
    await request(app.getHttpServer() as Server)
      .post('/files/upload')
      .attach('file', Buffer.from('example'), {
        filename: 'example.png',
        contentType: 'text/plain',
      })
      .expect(400);
    expect(s3.putObject).not.toHaveBeenCalled();
  });

  it.each(['', 'Invalid_Bucket', 'ab', 'a..b', '192.168.1.1'])(
    'rejects invalid bucket %j',
    async (bucket) => {
      await request(app.getHttpServer() as Server)
        .post('/files/upload')
        .field('bucket', bucket)
        .attach('file', Buffer.from('example'), 'example.txt')
        .expect(400);

      expect(s3.headBucket).not.toHaveBeenCalled();
      expect(s3.putObject).not.toHaveBeenCalled();
    },
  );

  it('rejects repeated bucket fields', async () => {
    await request(app.getHttpServer() as Server)
      .post('/files/upload')
      .field('bucket', 'uploads')
      .field('bucket', 'other')
      .attach('file', Buffer.from('example'), 'example.txt')
      .expect(400);

    expect(s3.putObject).not.toHaveBeenCalled();
  });

  it('rejects requests without a file', async () => {
    const response = await request(app.getHttpServer() as Server)
      .post('/files/upload')
      .expect(400);

    expect(response.body).toMatchObject({ message: 'File is required' });
  });
});
