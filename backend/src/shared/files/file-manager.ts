import type { StoredFile } from './entities/stored-file.entity';
import type { FileBucket } from './file-bucket';
import type { EntityManager } from 'typeorm';
import type { Readable } from 'node:stream';

export const MAX_FILE_UPLOAD_BYTES = 'MAX_FILE_UPLOAD_BYTES';

export interface UploadFile {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
  bucket?: FileBucket;
  hackathonId?: number;
  teamId?: number;
}

export abstract class FileManager {
  abstract upload(
    file: UploadFile,
    manager?: EntityManager,
  ): Promise<StoredFile>;
  abstract getFile(file: StoredFile): Promise<string>;
  abstract getStream(file: StoredFile): Promise<Readable>;
  abstract delete(file: StoredFile, manager?: EntityManager): Promise<void>;
}
