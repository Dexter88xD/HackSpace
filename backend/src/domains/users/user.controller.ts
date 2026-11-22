import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Req,
  UseGuards,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';

import { UserService } from './user.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me/profile')
  getProfile(@Req() req: AuthenticatedRequest) {
    return this.userService.getProfile(req.user.userId);
  }

  @Get(':id/public')
  getPublicProfile(@Param("id", ParseIntPipe) userId: number) {
    return this.userService.getPublicProfile(userId);
  }

  @Get('search')
  searchUsers(
    @Query('q') query: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.userService.searchUsers(
      query,
      req.user.userId,
    );
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
}
