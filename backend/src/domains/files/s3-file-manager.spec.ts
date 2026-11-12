import { BadRequestException } from '@nestjs/common';
import { S3ServiceException } from '@aws-sdk/client-s3';
import type { S3 } from 'nestjs-s3';
import { S3FileManager } from './s3-file-manager';

describe('S3FileManager', () => {
  const file = {
    originalname: 'example.txt',
    mimetype: 'text/plain',
    buffer: Buffer.from('example'),
    bucket: 'uploads',
  };
  let s3: {
    headBucket: jest.Mock;
    createBucket: jest.Mock;
    putObject: jest.Mock;
  };
  let manager: S3FileManager;

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
    };
    manager = new S3FileManager(s3 as unknown as S3);
  });

  it('uploads bytes and content type to an existing bucket using the original name', async () => {
    await expect(manager.upload(file)).resolves.toBe(
      'S3 upload successful: uploads/example.txt',
    );
    expect(s3.headBucket).toHaveBeenCalledWith({ Bucket: 'uploads' });
    expect(s3.createBucket).not.toHaveBeenCalled();
    expect(s3.putObject).toHaveBeenCalledWith({
      Bucket: 'uploads',
      Key: file.originalname,
      Body: file.buffer,
      ContentType: file.mimetype,
    });
  });

  it('creates the default bucket when it does not exist', async () => {
    s3.headBucket.mockRejectedValue(storageError('NotFound', 404));

    await expect(manager.upload({ ...file, bucket: undefined })).resolves.toBe(
      'S3 upload successful: default/example.txt',
    );
    expect(s3.createBucket).toHaveBeenCalledWith({ Bucket: 'default' });
    expect(s3.putObject).toHaveBeenCalledWith(
      expect.objectContaining({ Bucket: 'default' }),
    );
  });

  it('creates the explicitly selected bucket when missing', async () => {
    s3.headBucket.mockRejectedValue(storageError('NotFound', 404));

    await manager.upload(file);

    expect(s3.createBucket).toHaveBeenCalledWith({ Bucket: 'uploads' });
    expect(s3.putObject).toHaveBeenCalledTimes(1);
  });

  it('continues when a concurrent request already created the owned bucket', async () => {
    s3.headBucket.mockRejectedValue(storageError('NotFound', 404));
    s3.createBucket.mockRejectedValue(
      storageError('BucketAlreadyOwnedByYou', 409),
    );

    await expect(manager.upload(file)).resolves.toBe(
      'S3 upload successful: uploads/example.txt',
    );
    expect(s3.putObject).toHaveBeenCalledTimes(1);
  });

  it.each([
    storageError('Forbidden', 403),
    storageError('InternalError', 500),
    new Error('Connection refused'),
  ])(
    'propagates bucket lookup failures without creating a bucket',
    async (error) => {
      s3.headBucket.mockRejectedValue(error);

      await expect(manager.upload(file)).rejects.toBe(error);
      expect(s3.createBucket).not.toHaveBeenCalled();
      expect(s3.putObject).not.toHaveBeenCalled();
    },
  );

  it('propagates bucket creation failures without uploading', async () => {
    const error = storageError('BucketAlreadyExists', 409);
    s3.headBucket.mockRejectedValue(storageError('NotFound', 404));
    s3.createBucket.mockRejectedValue(error);

    await expect(manager.upload(file)).rejects.toBe(error);
    expect(s3.putObject).not.toHaveBeenCalled();
  });

  it('propagates upload failures instead of confirming success', async () => {
    const error = storageError('AccessDenied', 403);
    s3.putObject.mockRejectedValue(error);

    await expect(manager.upload(file)).rejects.toBe(error);
  });

  it.each([
    '',
    'ab',
    'Invalid',
    'a_b',
    'a..b',
    '127.0.0.1',
    'xn--test',
    'a'.repeat(64),
  ])('rejects invalid bucket %j before contacting storage', async (bucket) => {
    await expect(manager.upload({ ...file, bucket })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(s3.headBucket).not.toHaveBeenCalled();
    expect(s3.putObject).not.toHaveBeenCalled();
  });
});
