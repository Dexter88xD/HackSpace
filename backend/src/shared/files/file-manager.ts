import type { StoredFile } from './entities/stored-file.entity';
import type { FileBucket } from './file-bucket';

export const FILE_PUBLIC_ENDPOINT = 'FILE_PUBLIC_ENDPOINT';
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
  abstract upload(file: UploadFile): Promise<StoredFile>;
  abstract getFile(file: StoredFile): Promise<string>;
  abstract delete(file: StoredFile): Promise<void>;
}
