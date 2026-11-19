import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { ChatService } from './chat.service';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';

@Controller('chat-rooms')
@UseGuards(AuthGuard('jwt'))
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get(':chatRoomId/messages')
  getMessages(
    @Param('chatRoomId', ParseIntPipe) chatRoomId: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.chatService.getMessages(req.user.userId, chatRoomId);
  }
}
