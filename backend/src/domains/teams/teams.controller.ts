import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { TeamsService } from './teams.service';

@UseGuards(JwtAuthGuard)
@Controller()
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post('hackathons/:hackathonId/teams')
  create(
    @Param('hackathonId', ParseIntPipe) hackathonId: number,
    @Body() createTeamDto: CreateTeamDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.teamsService.create(
      hackathonId,
      createTeamDto,
      req.user.userId,
    );
  }

  @Get('hackathons/:hackathonId/teams')
  findAll(@Param('hackathonId', ParseIntPipe) hackathonId: number) {
    return this.teamsService.findAll(hackathonId);
  }

  @Get('hackathons/:hackathonId/teams/me')
  findMine(
    @Param('hackathonId', ParseIntPipe) hackathonId: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.teamsService.findMine(hackathonId, req.user.userId);
  }

  @Get('teams/:id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.teamsService.findOne(id);
  }

  @Patch('teams/:id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTeamDto: UpdateTeamDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.teamsService.update(id, updateTeamDto, req.user.userId);
  }

  @Delete('teams/:id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.teamsService.remove(id, req.user.userId);
  }

  @Get('hackathons/:hackathonId/join-requests/me')
  findMyRequests(
    @Param('hackathonId', ParseIntPipe) hackathonId: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.teamsService.findMyRequests(hackathonId, req.user.userId);
  }

  @Post('teams/:id/join-requests')
  requestToJoin(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.teamsService.requestToJoin(id, req.user.userId);
  }

  @Get('teams/:id/join-requests')
  findRequests(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.teamsService.findRequests(id, req.user.userId);
  }

  @Post('join-requests/:id/accept')
  acceptRequest(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.teamsService.acceptRequest(id, req.user.userId);
  }

  @Post('join-requests/:id/reject')
  rejectRequest(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.teamsService.rejectRequest(id, req.user.userId);
  }

  @Delete('join-requests/:id')
  cancelRequest(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.teamsService.cancelRequest(id, req.user.userId);
  }

  @Delete('teams/:id/members/:userId')
  removeMember(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) memberUserId: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.teamsService.removeMember(id, memberUserId, req.user.userId);
  }

  @Delete('teams/:id/leave')
  leave(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.teamsService.leave(id, req.user.userId);
  }
}
