import {
  Body,
  Controller,
  Delete,
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
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.hackathonsService.findDetails(id, req.user.userId);
  }

  @Get(':id/current-phase')
  getHackathonCurrentPhase(@Param('id', ParseIntPipe) id: number) {
    return this.hackathonsService.getHackathonCurrentPhase(id);
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

  // Hackathon Registration
  @Post(':id/register')
  async hackathonRegister(
    @Param('id', ParseIntPipe) hackathonId: number,
    @Req() req: AuthenticatedRequest,
  ) {
    const registration = await this.hackathonsService.hackathonRegister(
      req.user.userId,
      hackathonId,
    );
    return {
      message: 'Successfully registered for the hackathon',
      data: {
        hackathonId,
        userId: req.user.userId,
        role: registration.hack_role_name,
      },
    };
  }

  @Delete(':id/unregister')
  hackathonUnregister(
    @Param('id', ParseIntPipe) hackathonId: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.hackathonsService.hackathonUnregister(
      req.user.userId,
      hackathonId,
    );
  }

  @Get(':id/membership')
  async getMembership(
    @Param('id', ParseIntPipe) hackathonId: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return await this.hackathonsService.getMembership(
      req.user.userId,
      hackathonId,
    );
  }
}
