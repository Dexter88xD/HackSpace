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
    ValidationPipe } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface'

import { FriendsService } from './friends.service'
import { SendFriendRequestDto } from './dto/send-friend-request.dto';

@Controller('friends')
@UseGuards(AuthGuard('jwt'))
export class FriendsController {
    constructor(
        private readonly friendsService: FriendsService,
    ) {}

    @Get()
    getFriends(@Req() req: AuthenticatedRequest) {
        return this.friendsService.getFriends(req.user.userId);
    }

    @Get('requests/incoming')
    getIncomingRequests(@Req() req: AuthenticatedRequest) {
        return this.friendsService.getIncomingRequests(req.user.userId);
    }

    @Get('requests/outgoing')
    getOutgoingRequests(@Req() req: AuthenticatedRequest) {
        return this.friendsService.getOutgoingRequests(req.user.userId);
    }

    @Get('status/:id')
    getRelationshipStatus(
        @Req() req: AuthenticatedRequest,
        @Param('id', ParseIntPipe) targetId: number,
    ) {
        return this.friendsService.getRelationshipStatus(req.user.userId, targetId);
    }

    @Post('requests')
    @HttpCode(HttpStatus.CREATED)
    async sendFriendRequest(
        @Req() req:AuthenticatedRequest,
        @Body(new ValidationPipe({ whitelist: true, transform: false })) body: SendFriendRequestDto) {
            const friendship = await this.friendsService.sendFriendRequest(req.user.userId, body.addresseeId);
            return {
                id: friendship.id,
                requesterId: friendship.requesterId,
                addresseeId: friendship.addresseeId,
                status: friendship.status,
                createdAt: friendship.createdAt,
            }
        }

    @Patch('requests/:id/accept')
    @HttpCode(HttpStatus.NO_CONTENT)
    async acceptFriendRequest(
        @Req() req: AuthenticatedRequest,
        @Param('id', ParseIntPipe) friendshipId: number,
    ) {
        await this.friendsService.acceptFriendRequest(friendshipId, req.user.userId);
    }

    @Delete('requests/:id/reject')
    @HttpCode(HttpStatus.NO_CONTENT)
    async rejectFriendRequest(
        @Req() req: AuthenticatedRequest,
        @Param('id', ParseIntPipe) friendshipId: number,
    ) {
        await this.friendsService.rejectFriendRequest(friendshipId, req.user.userId);
    }

    @Delete('requests/:id/cancel')
    @HttpCode(HttpStatus.NO_CONTENT)
    async cancelFriendRequest(
        @Req() req:AuthenticatedRequest,
        @Param('id', ParseIntPipe) friendshipId: number,
    ) {
        await this.friendsService.cancelFriendRequest(friendshipId, req.user.userId);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async removeFriend(
        @Req() req: AuthenticatedRequest,
        @Param('id', ParseIntPipe) friendshipId: number,
    ) {
        await this.friendsService.removeFriend(friendshipId, req.user.userId);
    }
}