import { Injectable } from '@nestjs/common';
import { FileManager } from './file-manager';
import type { UploadFile } from './file-manager';

@Injectable()
export class FilesService {
  constructor(private readonly fileManager: FileManager) {}

  upload(file: UploadFile): Promise<string> {
    return this.fileManager.upload(file);
  }
}
