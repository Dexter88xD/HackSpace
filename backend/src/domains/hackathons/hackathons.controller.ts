import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { HackathonsService } from './hackathons.service';
import { CreateHackathonDto } from './dto/create-hackathon.dto';
import { UpdateHackathonDto } from './dto/update-hackathon.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleName } from '../../database/entities/user-role.entity';

@Controller('hackathons')
export class HackathonsController {
  constructor(private readonly hackathonsService: HackathonsService) {}

  @Roles(RoleName.ROLE_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post()
  create(@Body() createHackathonDto: CreateHackathonDto) {
    return this.hackathonsService.create(createHackathonDto);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.hackathonsService.findOne(id);
  }

  @Roles(RoleName.ROLE_ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateHackathonDto: UpdateHackathonDto,
  ) {
    return this.hackathonsService.update(id, updateHackathonDto);
  }
}
