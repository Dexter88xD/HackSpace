import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { UploadFile } from './file-manager';
import { FilesService } from './files.service';
import { UploadFileDto } from './dto/upload-file.dto';

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Delete(':id')
  @HttpCode(204)
  delete(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
    return this.filesService.delete(id);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: UploadFile | undefined,
    @Body() dto: UploadFileDto,
  ): Promise<{ url: string }> {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const url = await this.filesService.upload({ ...file, ...dto });
    return { url };
  }
}
