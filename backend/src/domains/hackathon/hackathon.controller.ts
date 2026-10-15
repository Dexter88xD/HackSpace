import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { HackathonService } from './hackathon.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
// import { HackathonPhaseName } from '../../database/entities/hackathon-phase.entity';
import { HackathonFiltersDto } from './dto/hackathon-filters.dto';

@UseGuards(JwtAuthGuard)
@Controller('hackathons')
export class HackathonController {
  constructor(private readonly hackathonService: HackathonService) {}

  @Get()
  findAll(@Query() query: HackathonFiltersDto) {
    return this.hackathonService.findAll(query);
  }
}
