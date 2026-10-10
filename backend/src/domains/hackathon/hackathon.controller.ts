import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { HackathonService } from './hackathon.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { HackathonPhaseName } from '../../database/entities/hackathon-phase.entity';

@UseGuards(JwtAuthGuard)
@Controller('hackathons')
export class HackathonController {
  constructor(private readonly hackathonService: HackathonService) {}

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('phase') phase?: HackathonPhaseName,
  ) {
    return this.hackathonService.findAll(
      search,
      startDate,
      endDate,
      page,
      limit,
      phase,
    );
  }
}
