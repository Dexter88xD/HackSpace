import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { AssignJudgeDto } from './dto/assign-judge.dto';
import { JuryService } from './jury.service';
import { CreateScoringCriterionDto } from './dto/create-scoring-criterion.dto';
import { UpsertTeamScoresDto } from './dto/upsert-team-scores.dto';
import { UpdateScoringCriterionDto } from './dto/update-scoring-criterion.dto';

@UseGuards(JwtAuthGuard)
@Controller('hackathons/:hackathonId')
export class JuryController {
  constructor(private readonly juryService: JuryService) {}

  @Post('judges')
  assignJudge(
    @Param('hackathonId', ParseIntPipe) hackathonId: number,
    @Body() dto: AssignJudgeDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.juryService.assignJudge(
      hackathonId,
      dto.userId,
      req.user.userId,
    );
  }

  @Delete('judges/:judgeId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeJudge(
    @Param('hackathonId', ParseIntPipe) hackathonId: number,
    @Param('judgeId', ParseIntPipe) judgeId: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.juryService.removeJudge(hackathonId, judgeId, req.user.userId);
  }

  @Get('judges')
  findJudges(@Param('hackathonId', ParseIntPipe) hackathonId: number) {
    return this.juryService.findJudges(hackathonId);
  }

  @Post('criteria')
  createCriterion(
    @Param('hackathonId', ParseIntPipe) hackathonId: number,
    @Body() dto: CreateScoringCriterionDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.juryService.createCriterion(hackathonId, dto, req.user.userId);
  }

  @Patch('criteria/:criterionId')
  updateCriterion(
    @Param('hackathonId', ParseIntPipe) hackathonId: number,
    @Param('criterionId', ParseIntPipe) criterionId: number,
    @Body() dto: UpdateScoringCriterionDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.juryService.updateCriterion(
      hackathonId,
      criterionId,
      dto,
      req.user.userId,
    );
  }

  @Delete('criteria/:criterionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeCriterion(
    @Param('hackathonId', ParseIntPipe) hackathonId: number,
    @Param('criterionId', ParseIntPipe) criterionId: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.juryService.removeCriterion(
      hackathonId,
      criterionId,
      req.user.userId,
    );
  }

  @Get('criteria')
  findCriteria(@Param('hackathonId', ParseIntPipe) hackathonId: number) {
    return this.juryService.findCriteria(hackathonId);
  }

  @Put('teams/:teamId/scores')
  upsertTeamScores(
    @Param('hackathonId', ParseIntPipe) hackathonId: number,
    @Param('teamId', ParseIntPipe) teamId: number,
    @Body() dto: UpsertTeamScoresDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.juryService.upsertTeamScores(
      hackathonId,
      teamId,
      req.user.userId,
      dto,
    );
  }

  @Get('teams/:teamId/scores/me')
  getMyTeamScores(
    @Param('hackathonId', ParseIntPipe) hackathonId: number,
    @Param('teamId', ParseIntPipe) teamId: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.juryService.getMyTeamScores(
      hackathonId,
      teamId,
      req.user.userId,
    );
  }

  @Get('rankings')
  getRankings(
    @Param('hackathonId', ParseIntPipe) hackathonId: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.juryService.getRankings(hackathonId, req.user.userId);
  }

  @Get('jury/teams')
  findEligibleTeams(
    @Param('hackathonId', ParseIntPipe) hackathonId: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.juryService.findEligibleTeams(hackathonId, req.user.userId);
  }
}
