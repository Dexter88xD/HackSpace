import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { FileManager } from './file-manager';
import { S3FileManager } from './s3-file-manager';
import { getS3ConnectionToken } from 'nestjs-s3';

describe('FilesController', () => {
  let app: INestApplication;
  const s3 = {
    headBucket: jest.fn().mockResolvedValue({}),
    createBucket: jest.fn().mockResolvedValue({}),
    putObject: jest.fn().mockResolvedValue({}),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [FilesController],
      providers: [
        FilesService,
        { provide: FileManager, useClass: S3FileManager },
        { provide: getS3ConnectionToken(''), useValue: s3 },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('accepts a multipart file and uses the default bucket', async () => {
    await request(app.getHttpServer())
      .post('/files/upload')
      .attach('file', Buffer.from('example'), 'example.txt')
      .expect(201)
      .expect('S3 upload successful: default/example.txt');

    expect(s3.putObject).toHaveBeenCalledWith({
      Bucket: 'default',
      Key: 'example.txt',
      Body: Buffer.from('example'),
      ContentType: 'text/plain',
    });
  });

  it('forwards the multipart bucket field', async () => {
    await request(app.getHttpServer())
      .post('/files/upload')
      .field('bucket', 'uploads')
      .attach('file', Buffer.from('example'), 'example.txt')
      .expect(201)
      .expect('S3 upload successful: uploads/example.txt');

    expect(s3.headBucket).toHaveBeenCalledWith({ Bucket: 'uploads' });
  });

  it.each(['', 'Invalid_Bucket', 'ab', 'a..b', '192.168.1.1'])(
    'rejects invalid bucket %j',
    async (bucket) => {
      await request(app.getHttpServer())
        .post('/files/upload')
        .field('bucket', bucket)
        .attach('file', Buffer.from('example'), 'example.txt')
        .expect(400);

      expect(s3.headBucket).not.toHaveBeenCalled();
      expect(s3.putObject).not.toHaveBeenCalled();
    },
  );

  it('rejects repeated bucket fields', async () => {
    await request(app.getHttpServer())
      .post('/files/upload')
      .field('bucket', 'uploads')
      .field('bucket', 'other')
      .attach('file', Buffer.from('example'), 'example.txt')
      .expect(400);

    expect(s3.putObject).not.toHaveBeenCalled();
  });

  it('rejects requests without a file', async () => {
    const response = await request(app.getHttpServer())
      .post('/files/upload')
      .expect(400);

    expect(response.body).toMatchObject({ message: 'File is required' });
  });
});
