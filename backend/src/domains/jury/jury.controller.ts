import {
  Body,
  Controller,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { AssignJudgeDto } from './dto/assign-judge.dto';
import { JuryService } from './jury.service';

@UseGuards(JwtAuthGuard)
@Controller('hackathons/:hackathonId/judges')
export class JuryController {
  constructor(private readonly juryService: JuryService) {}

  @Post()
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
}
