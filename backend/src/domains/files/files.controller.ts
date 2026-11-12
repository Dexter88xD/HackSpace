import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { UploadFile } from './file-manager';
import { FilesService } from './files.service';

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @UploadedFile() file: UploadFile | undefined,
    @Body('bucket') bucket?: string,
  ): Promise<string> {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    if (bucket !== undefined && typeof bucket !== 'string') {
      throw new BadRequestException('Invalid bucket name');
    }

    return this.filesService.upload({ ...file, bucket });
  }
}
