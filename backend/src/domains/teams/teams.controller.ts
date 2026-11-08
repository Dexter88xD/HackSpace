import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { CreateTeamDto } from './dto/create-team.dto';
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

  @Post('teams/:id/join')
  join(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.teamsService.join(id, req.user.userId);
  }

  @Delete('teams/:id/leave')
  leave(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.teamsService.leave(id, req.user.userId);
  }
}
