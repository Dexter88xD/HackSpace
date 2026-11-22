import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  ParseIntPipe,
  Req,
  UseGuards,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { FriendshipsService } from './friendships.service';
import { SendFriendRequestDto } from './dto/send-friend-request.dto';

@Controller('friends')
@UseGuards(JwtAuthGuard)
export class FriendshipsController {
  constructor(private readonly friendshipsService: FriendshipsService) {}

  @Get()
  getFriends(@Req() req: AuthenticatedRequest) {
    return this.friendshipsService.getFriends(req.user.userId);
  }

  @Get('requests/incoming')
  getIncomingRequests(@Req() req: AuthenticatedRequest) {
    return this.friendshipsService.getIncomingRequests(req.user.userId);
  }

  @Get('requests/outgoing')
  getOutgoingRequests(@Req() req: AuthenticatedRequest) {
    return this.friendshipsService.getOutgoingRequests(req.user.userId);
  }

  @Get('status/:id')
  getRelationshipStatus(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) targetId: number,
  ) {
    return this.friendshipsService.getRelationshipStatus(
      req.user.userId,
      targetId,
    );
  }

  @Post('requests')
  @HttpCode(HttpStatus.CREATED)
  async sendFriendRequest(
    @Req() req: AuthenticatedRequest,
    @Body() body: SendFriendRequestDto,
  ) {
    const friendship = await this.friendshipsService.sendFriendRequest(
      req.user.userId,
      body.addresseeId,
    );
    return {
      id: friendship.id,
      requesterId: friendship.requesterId,
      addresseeId: friendship.addresseeId,
      status: friendship.status,
      createdAt: friendship.createdAt,
    };
  }

  @Patch('requests/:id/accept')
  @HttpCode(HttpStatus.NO_CONTENT)
  async acceptFriendRequest(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) friendshipId: number,
  ) {
    await this.friendshipsService.acceptFriendRequest(
      friendshipId,
      req.user.userId,
    );
  }

  @Delete('requests/:id/reject')
  @HttpCode(HttpStatus.NO_CONTENT)
  async rejectFriendRequest(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) friendshipId: number,
  ) {
    await this.friendshipsService.rejectFriendRequest(
      friendshipId,
      req.user.userId,
    );
  }

  @Delete('requests/:id/cancel')
  @HttpCode(HttpStatus.NO_CONTENT)
  async cancelFriendRequest(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) friendshipId: number,
  ) {
    await this.friendshipsService.cancelFriendRequest(
      friendshipId,
      req.user.userId,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeFriend(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) friendshipId: number,
  ) {
    await this.friendshipsService.removeFriend(friendshipId, req.user.userId);
  }
}
