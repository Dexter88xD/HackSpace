import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StoredFile } from './entities/stored-file.entity';
import { FileManager } from './file-manager';
import type { UploadFile } from './file-manager';

@Injectable()
export class FilesService {
  constructor(
    private readonly fileManager: FileManager,
    @InjectRepository(StoredFile)
    private readonly files: Repository<StoredFile>,
  ) {}

  async delete(id: string): Promise<void> {
    const file = await this.files.findOneBy({ id });
    if (!file) throw new NotFoundException('File not found');
    await this.fileManager.delete(file);
  }

  async upload(file: UploadFile): Promise<string> {
    const storedFile = await this.fileManager.upload(file);
    return this.fileManager.getFile(storedFile);
  }
}
