import {
  Controller,
  Delete,
  Get,
  Header,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import type { UploadFile } from '../../shared/files/file-manager';
import { TeamSubmissionsService } from './team-submissions.service';

@Controller('teams/:teamId/submission')
@UseGuards(JwtAuthGuard)
export class TeamSubmissionsController {
  constructor(private readonly submissions: TeamSubmissionsService) {}

  @Get()
  @Header('Cache-Control', 'private, no-store')
  get(
    @Param('teamId', ParseIntPipe) teamId: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.submissions.get(teamId, req.user.userId);
  }

  @Post('files')
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @Param('teamId', ParseIntPipe) teamId: number,
    @Req() req: AuthenticatedRequest,
    @UploadedFile() file?: UploadFile,
  ) {
    return this.submissions.upload(teamId, req.user.userId, file);
  }

  @Get('files/:fileId')
  @Header('Cache-Control', 'private, no-store')
  @Header('X-Content-Type-Options', 'nosniff')
  download(
    @Param('teamId', ParseIntPipe) teamId: number,
    @Param('fileId', ParseUUIDPipe) fileId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.submissions.download(teamId, req.user.userId, fileId);
  }

  @Delete('files/:fileId')
  remove(
    @Param('teamId', ParseIntPipe) teamId: number,
    @Param('fileId', ParseUUIDPipe) fileId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.submissions.remove(teamId, req.user.userId, fileId);
  }

  @Post('submit')
  submit(
    @Param('teamId', ParseIntPipe) teamId: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.submissions.setSubmitted(teamId, req.user.userId, true);
  }

  @Post('unsubmit')
  unsubmit(
    @Param('teamId', ParseIntPipe) teamId: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.submissions.setSubmitted(teamId, req.user.userId, false);
  }
}
