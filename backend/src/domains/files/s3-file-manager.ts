import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectS3 } from 'nestjs-s3';
import type { S3 } from 'nestjs-s3';
import { S3ServiceException } from '@aws-sdk/client-s3';
import { FileManager } from './file-manager';
import type { UploadFile } from './file-manager';

@Injectable()
export class S3FileManager extends FileManager {
  constructor(@InjectS3() private readonly s3: S3) {
    super();
  }

  async upload(file: UploadFile): Promise<string> {
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
      Key: file.originalname,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    return `S3 upload successful: ${bucket}/${file.originalname}`;
  }
}
