import {
  Controller,
  Delete,
  HttpCode,
  Header,
  Get,
  Post,
  Patch,
  Body,
  Req,
  UseGuards,
  Param,
  ParseIntPipe,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';

import { UserService } from './user.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { UploadFile } from '../../shared/files/file-manager';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me/profile')
  getProfile(@Req() req: AuthenticatedRequest) {
    return this.userService.getProfile(req.user.userId);
  }

  @Get(':id/public')
  getPublicProfile(@Param('id', ParseIntPipe) userId: number) {
    return this.userService.getPublicProfile(userId);
  }

  @Get('search')
  searchUsers(@Query('q') query: string, @Req() req: AuthenticatedRequest) {
    return this.userService.searchUsers(query, req.user.userId);
  }

  @Post('me/profile')
  createProfile(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateProfileDto,
  ) {
    return this.userService.createProfile(req.user.userId, dto);
  }

  @Patch('me/profile')
  updateProfile(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.userService.updateProfile(req.user.userId, dto);
  }

  @Get('me/profile/avatar')
  @Header('Cache-Control', 'private, no-store')
  @Header('X-Content-Type-Options', 'nosniff')
  getAvatar(@Req() req: AuthenticatedRequest) {
    return this.userService.getAvatar(req.user.userId);
  }

  @Delete('me/profile/avatar')
  @HttpCode(204)
  deleteAvatar(@Req() req: AuthenticatedRequest): Promise<void> {
    return this.userService.deleteAvatar(req.user.userId);
  }

  @Post('me/profile/avatar')
  @UseInterceptors(FileInterceptor('file'))
  uploadAvatar(
    @Req() req: AuthenticatedRequest,
    @UploadedFile() file: UploadFile | undefined,
  ) {
    // Return the avatar signed link
    return this.userService.uploadAvatar(req.user.userId, file);
  }
}
