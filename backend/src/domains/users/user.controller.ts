import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Req,
  UseGuards,
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
