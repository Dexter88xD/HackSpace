import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { HackathonsService } from './hackathons.service';
import { CreateHackathonDto } from './dto/create-hackathon.dto';
import { UpdateHackathonDto } from './dto/update-hackathon.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { HackathonFiltersDto } from './dto/hackathons-filters.dto';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';

@UseGuards(JwtAuthGuard)
@Controller('hackathons')
export class HackathonsController {
  constructor(private readonly hackathonsService: HackathonsService) {}

  @Post()
  create(
    @Body() createHackathonDto: CreateHackathonDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.hackathonsService.create(createHackathonDto, req.user.userId);
  }

  @Get()
  findAll(@Query() query: HackathonFiltersDto) {
    return this.hackathonsService.findAll(query);
  }

  @Get('mine')
  findMine(
    @Query() query: HackathonFiltersDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.hackathonsService.findMine(req.user.userId, query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.hackathonsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateHackathonDto: UpdateHackathonDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.hackathonsService.update(
      id,
      updateHackathonDto,
      req.user.userId,
    );
  }
}
