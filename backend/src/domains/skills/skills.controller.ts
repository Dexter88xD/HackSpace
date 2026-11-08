import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SkillsService } from './skills.service';
import { AddSkillDto, ParseSkillBatchPipe } from './dto/add-skill.dto';
import type { AddSkillsDto } from './dto/add-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { RemoveSkillsDto } from './dto/remove-skills.dto';
import {
  ProfileIdParamsDto,
  SkillIdParamsDto,
  SkillNameQueryDto,
  SkillNameLookupQueryDto,
} from './dto/skill-validation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';

@UseGuards(JwtAuthGuard)
@Controller('skills')
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  @Get()
  findAll(@Query() query: SkillNameQueryDto) {
    return this.skillsService.findAll(query);
  }

  @Get('by-name')
  findByName(@Query() query: SkillNameLookupQueryDto) {
    return this.skillsService.findByName(query.name);
  }

  @Post()
  add(@Body() dto: AddSkillDto, @Req() req: AuthenticatedRequest) {
    return this.skillsService.add(dto, req.user.userId);
  }

  @Post('batch')
  addBatch(
    @Body(ParseSkillBatchPipe) dtos: AddSkillsDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.skillsService.addBatch(dtos, req.user.userId);
  }

  @Get('profiles/:profileId')
  findByProfile(@Param() params: ProfileIdParamsDto) {
    return this.skillsService.findByProfile(params.profileId);
  }

  @Delete('profiles/:profileId')
  @HttpCode(204)
  removeFromProfile(
    @Param() params: ProfileIdParamsDto,
    @Body() dto: RemoveSkillsDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.skillsService.removeFromProfile(
      params.profileId,
      dto.skillIds,
      req.user.userId,
    );
  }

  @Get(':id')
  findOne(@Param() params: SkillIdParamsDto) {
    return this.skillsService.findOne(params.id);
  }

  @Patch(':id')
  update(
    @Param() params: SkillIdParamsDto,
    @Body() dto: UpdateSkillDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.skillsService.update(params.id, dto, req.user.userId);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param() params: SkillIdParamsDto, @Req() req: AuthenticatedRequest) {
    return this.skillsService.remove(params.id, req.user.userId);
  }
}
