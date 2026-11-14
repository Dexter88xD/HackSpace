import {
  BadRequestException,
  Logger,
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { S3 as SigningClient, S3ServiceException } from '@aws-sdk/client-s3';
import type { S3 } from 'nestjs-s3';
import type { Repository } from 'typeorm';
import { S3FileManager } from './s3-file-manager';
import { StoredFile } from './entities/stored-file.entity';
import { FileType } from './file-type';
import { FileBucket } from './file-bucket';
import type { Hackathon } from '../../domains/hackathons/entities/hackathon.entity';
import type { Team } from '../../domains/teams/entities/team.entity';

describe('S3FileManager', () => {
  const file = {
    originalname: 'example.txt',
    mimetype: 'text/plain',
    buffer: Buffer.from('example'),
    bucket: FileBucket.DEFAULT,
  };
  const hackathon = { id: 1 } as Hackathon;
  const team = { id: 2, hackathon } as Team;
  let s3: {
    headBucket: jest.Mock;
    createBucket: jest.Mock;
    putObject: jest.Mock;
    deleteObject: jest.Mock;
  };
  let files: { create: jest.Mock; save: jest.Mock; delete: jest.Mock };
  let hackathons: { findOneBy: jest.Mock };
  let teams: { findOne: jest.Mock };
  let manager: S3FileManager;
  let publicS3: SigningClient;
  const storageError = (name: string, status: number) =>
    new S3ServiceException({
      name,
      message: name,
      $fault: 'client',
      $metadata: { httpStatusCode: status },
    });

  beforeEach(() => {
    s3 = {
      headBucket: jest.fn().mockResolvedValue({}),
      createBucket: jest.fn().mockResolvedValue({}),
      putObject: jest.fn().mockResolvedValue({}),
      deleteObject: jest.fn().mockResolvedValue({}),
    };
    files = {
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
      create: jest.fn((data: Partial<StoredFile>) =>
        Object.assign(new StoredFile(), data),
      ),
      save: jest.fn((entity: StoredFile) =>
        Promise.resolve(Object.assign(entity, { createdAt: new Date() })),
      ),
    };
    hackathons = { findOneBy: jest.fn().mockResolvedValue(hackathon) };
    teams = { findOne: jest.fn().mockResolvedValue(team) };
    publicS3 = new SigningClient({
      endpoint: 'http://localhost:9000',
      region: 'us-east-1',
      forcePathStyle: true,
      credentials: { accessKeyId: 'test', secretAccessKey: 'test-secret' },
    });
    manager = new S3FileManager(
      s3 as unknown as S3,
      files as unknown as Repository<StoredFile>,
      hackathons as unknown as Repository<Hackathon>,
      teams as unknown as Repository<Team>,
      'http://localhost:9000/',
      publicS3,
      10,
    );
  });

  afterEach(() => {
    publicS3.destroy();
  });

  it('rejects files above the configured limit before storage or database operations', async () => {
    await expect(
      manager.upload({ ...file, buffer: Buffer.alloc(11) }),
    ).rejects.toBeInstanceOf(PayloadTooLargeException);
    expect(s3.headBucket).not.toHaveBeenCalled();
    expect(s3.putObject).not.toHaveBeenCalled();
    expect(files.create).not.toHaveBeenCalled();
    expect(files.save).not.toHaveBeenCalled();
    expect(hackathons.findOneBy).not.toHaveBeenCalled();
    expect(teams.findOne).not.toHaveBeenCalled();
  });

  it('accepts files exactly at the configured limit', async () => {
    const stored = await manager.upload({ ...file, buffer: Buffer.alloc(10) });
    expect(stored.name).toBe(file.originalname);
    expect(s3.putObject).toHaveBeenCalledWith(
      expect.objectContaining({ Body: Buffer.alloc(10) }),
    );
  });

  it('deletes the storage object before removing its database row', async () => {
    const stored = Object.assign(new StoredFile(), {
      id: '2813bd63-e537-427a-a129-d23f24ab5148',
      name: 'example.txt',
      bucket: FileBucket.DEFAULT,
    });
    await manager.delete(stored);
    expect(s3.deleteObject).toHaveBeenCalledWith({
      Bucket: FileBucket.DEFAULT,
      Key: `${stored.id}.txt`,
    });
    expect(files.delete).toHaveBeenCalledWith(stored.id);
    expect(s3.deleteObject.mock.invocationCallOrder[0]).toBeLessThan(
      files.delete.mock.invocationCallOrder[0],
    );
  });

  it('retains metadata when storage deletion fails', async () => {
    const error = new Error('Storage unavailable');
    s3.deleteObject.mockRejectedValue(error);
    await expect(
      manager.delete(
        Object.assign(new StoredFile(), {
          id: 'test',
          name: 'example.txt',
          bucket: FileBucket.DEFAULT,
        }),
      ),
    ).rejects.toBe(error);
    expect(files.delete).not.toHaveBeenCalled();
  });

  it('propagates database deletion failures after removing the storage object', async () => {
    const error = new Error('Database unavailable');
    files.delete.mockRejectedValue(error);
    await expect(
      manager.delete(
        Object.assign(new StoredFile(), {
          id: 'test',
          name: 'example.txt',
          bucket: FileBucket.DEFAULT,
        }),
      ),
    ).rejects.toBe(error);
    expect(s3.deleteObject).toHaveBeenCalledTimes(1);
  });

  it('signs the stored bucket and UUID for one hour', async () => {
    const stored = Object.assign(new StoredFile(), {
      id: '2813bd63-e537-427a-a129-d23f24ab5148',
      name: 'original.txt',
      bucket: FileBucket.DEFAULT,
    });
    const url = new URL(await manager.getFile(stored));
    expect(url.origin).toBe('http://localhost:9000');
    expect(url.pathname).toBe(`/default/${stored.id}.txt`);
    expect(url.searchParams.get('X-Amz-Expires')).toBe('3600');
    expect(url.searchParams.get('X-Amz-Signature')).toBeTruthy();
    expect(files.save).not.toHaveBeenCalled();
    expect(s3.putObject).not.toHaveBeenCalled();
  });

  it('persists the original name with a UUID and extension as the object key', async () => {
    const stored = await manager.upload(file);
    expect(stored.createdAt).toBeInstanceOf(Date);
    expect(stored.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
    expect(stored).toMatchObject({
      name: file.originalname,
      bucket: FileBucket.DEFAULT,
      fileType: FileType.TXT,
      url: `http://localhost:9000/default/${stored.id}.txt`,
      hackathon: null,
      team: null,
    });
    expect(s3.putObject).toHaveBeenCalledWith({
      Bucket: FileBucket.DEFAULT,
      Key: `${stored.id}.txt`,
      Body: file.buffer,
      ContentType: file.mimetype,
    });
    expect(files.save).toHaveBeenCalledWith(stored);
    expect(s3.putObject.mock.invocationCallOrder[0]).toBeLessThan(
      files.save.mock.invocationCallOrder[0],
    );
    expect(s3.createBucket).not.toHaveBeenCalled();
    expect(stored.url).not.toContain('X-Amz-');
  });

  it('gives repeated filenames different IDs', async () => {
    const first = await manager.upload(file);
    const second = await manager.upload(file);
    expect(first.id).not.toBe(second.id);
    expect(first.name).toBe(second.name);
  });

  it.each([
    ['report.PDF', 'application/pdf', FileType.PDF],
    [
      'doc.docx',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      FileType.DOCX,
    ],
    [
      'slides.pptx',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      FileType.PPTX,
    ],
    ['notes.txt', 'text/plain', FileType.TXT],
    ['data.csv', 'text/csv', FileType.CSV],
    ['data.csv', 'application/csv', FileType.CSV],
    ['photo.jpg', 'image/jpeg', FileType.JPG],
    ['photo.JPEG', 'image/jpeg', FileType.JPG],
    ['photo.png', 'image/png', FileType.PNG],
  ])(
    'allows %s with matching MIME',
    async (originalname, mimetype, fileType) => {
      expect(
        await manager.upload({ ...file, originalname, mimetype }),
      ).toMatchObject({ name: originalname, fileType });
    },
  );

  it.each([
    ['file.exe', 'application/octet-stream'],
    ['file.png', 'text/plain'],
    ['README', 'text/plain'],
    ['file.txt', 'application/pdf'],
  ])(
    'rejects unsupported or mismatched type %s before storage',
    async (originalname, mimetype) => {
      await expect(
        manager.upload({ ...file, originalname, mimetype }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(s3.headBucket).not.toHaveBeenCalled();
      expect(files.save).not.toHaveBeenCalled();
    },
  );

  it('checks every enum bucket at initialization and leaves existing buckets alone', async () => {
    await manager.onModuleInit();
    expect(s3.headBucket.mock.calls).toEqual(
      Object.values(FileBucket).map((bucket) => [{ Bucket: bucket }]),
    );
    expect(s3.createBucket).not.toHaveBeenCalled();
  });

  it('creates missing enum buckets during initialization', async () => {
    s3.headBucket.mockRejectedValue(storageError('NotFound', 404));
    await manager.onModuleInit();
    expect(s3.createBucket).toHaveBeenCalledWith({
      Bucket: FileBucket.DEFAULT,
    });
  });

  it('tolerates concurrent startup creating an owned bucket', async () => {
    s3.headBucket.mockRejectedValue(storageError('NotFound', 404));
    s3.createBucket.mockRejectedValue(
      storageError('BucketAlreadyOwnedByYou', 409),
    );
    await expect(manager.onModuleInit()).resolves.toBeUndefined();
  });

  it.each([
    storageError('Forbidden', 403),
    storageError('InternalError', 500),
    new Error('Connection refused'),
  ])('fails initialization on storage lookup errors', async (error) => {
    s3.headBucket.mockRejectedValue(error);
    await expect(manager.onModuleInit()).rejects.toBe(error);
    expect(s3.createBucket).not.toHaveBeenCalled();
  });

  it('fails initialization when bucket creation fails', async () => {
    const error = storageError('BucketAlreadyExists', 409);
    s3.headBucket.mockRejectedValue(storageError('NotFound', 404));
    s3.createBucket.mockRejectedValue(error);
    await expect(manager.onModuleInit()).rejects.toBe(error);
  });

  it('uploads without bucket existence checks or creation', async () => {
    const stored = await manager.upload({ ...file, bucket: undefined });
    expect(stored.bucket).toBe(FileBucket.DEFAULT);
    expect(s3.headBucket).not.toHaveBeenCalled();
    expect(s3.createBucket).not.toHaveBeenCalled();
  });

  it('does not save metadata or delete an object when upload fails', async () => {
    const error = storageError('AccessDenied', 403);
    s3.putObject.mockRejectedValue(error);
    await expect(manager.upload(file)).rejects.toBe(error);
    expect(files.save).not.toHaveBeenCalled();
    expect(s3.deleteObject).not.toHaveBeenCalled();
  });

  it('deletes the uploaded object if metadata persistence fails', async () => {
    const error = new Error('Database unavailable');
    files.save.mockRejectedValue(error);
    await expect(manager.upload(file)).rejects.toBe(error);
    const created = files.create.mock.results[0].value as StoredFile;
    expect(s3.deleteObject).toHaveBeenCalledWith({
      Bucket: FileBucket.DEFAULT,
      Key: `${created.id}.txt`,
    });
  });

  it('logs cleanup failure and preserves the original database error', async () => {
    const error = new Error('Database unavailable');
    const cleanupError = new Error('Storage unavailable');
    const log = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    try {
      files.save.mockRejectedValue(error);
      s3.deleteObject.mockRejectedValue(cleanupError);
      await expect(manager.upload(file)).rejects.toBe(error);
      expect(log).toHaveBeenCalledWith(expect.any(String), cleanupError);
    } finally {
      log.mockRestore();
    }
  });

  it('links a hackathon without a team', async () => {
    expect(await manager.upload({ ...file, hackathonId: 1 })).toMatchObject({
      hackathon,
      team: null,
    });
    expect(hackathons.findOneBy).toHaveBeenCalledWith({ id: 1 });
  });

  it('derives the hackathon from a team', async () => {
    expect(await manager.upload({ ...file, teamId: 2 })).toMatchObject({
      hackathon,
      team,
    });
    expect(teams.findOne).toHaveBeenCalledWith({
      where: { id: 2 },
      relations: { hackathon: true },
    });
  });

  it('accepts matching explicit parents', async () => {
    expect(
      await manager.upload({ ...file, teamId: 2, hackathonId: 1 }),
    ).toMatchObject({ hackathon, team });
  });

  it('rejects conflicting parents before storage', async () => {
    hackathons.findOneBy.mockResolvedValue({ id: 3 });
    await expect(
      manager.upload({ ...file, hackathonId: 3, teamId: 2 }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(s3.headBucket).not.toHaveBeenCalled();
  });

  it.each(['hackathon', 'team'])(
    'rejects a missing %s before storage',
    async (parent) => {
      hackathons.findOneBy.mockResolvedValue(null);
      teams.findOne.mockResolvedValue(null);
      await expect(
        manager.upload({
          ...file,
          ...(parent === 'hackathon' ? { hackathonId: 1 } : { teamId: 2 }),
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(s3.headBucket).not.toHaveBeenCalled();
    },
  );

  it.each([
    '',
    'ab',
    'Invalid',
    'a_b',
    'a..b',
    '127.0.0.1',
    'xn--test',
    'a'.repeat(64),
  ])('rejects invalid bucket %j before storage', async (bucket) => {
    await expect(
      manager.upload({ ...file, bucket: bucket as FileBucket }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(s3.headBucket).not.toHaveBeenCalled();
    expect(files.save).not.toHaveBeenCalled();
  });
});
