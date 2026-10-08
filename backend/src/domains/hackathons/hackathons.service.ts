import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Hackathon } from '../../database/entities/hackathon.entity';
import { CreateHackathonDto } from './dto/create-hackathon.dto';
import { UpdateHackathonDto } from './dto/update-hackathon.dto';
import { HackathonSettings } from '../../database/entities/hackathon-settings.entity';

@Injectable()
export class HackathonsService {
  constructor(
    @InjectRepository(Hackathon)
    private readonly hackathonRepository: Repository<Hackathon>,

    private readonly dataSource: DataSource,
  ) {}

  async findOne(hackathonId: number) {
    const hackathon = await this.hackathonRepository.findOne({
      where: { id: hackathonId },
    });
    if (!hackathon) {
      throw new NotFoundException('Hackathon not found');
    }
    return hackathon;
  }

  async create(dto: CreateHackathonDto) {
    const startAt = new Date(dto.start_at);
    const endAt = new Date(dto.end_at);
    if (startAt >= endAt) {
      throw new BadRequestException('Hackathon dates are incorrect');
    }
    return this.dataSource.transaction(async (manager) => {
      const hackathon = manager.create(Hackathon, {
        title: dto.title,
        description: dto.description ?? null,
        organization_name: dto.organization_name,
        start_at: startAt,
        end_at: endAt,
      });
      const savedHackathon = await manager.save(hackathon);
      const hackathonSettings = manager.create(HackathonSettings, {
        min_team_members: 1,
        max_team_members: 5,
        files_limit: 0,
        file_max_size: 0,
        hackathon: savedHackathon,
      });
      await manager.save(hackathonSettings);
      return savedHackathon;
    });
  }

  async update(hackathonId: number, dto: UpdateHackathonDto) {
    const hackathon = await this.findOne(hackathonId);
    const startAt = dto.start_at ? new Date(dto.start_at) : hackathon.start_at;
    const endAt = dto.end_at ? new Date(dto.end_at) : hackathon.end_at;
    if (startAt >= endAt) {
      throw new BadRequestException('Hackathon dates are incorrect');
    }
    hackathon.title = dto.title ?? hackathon.title;
    hackathon.description =
      dto.description === undefined ? hackathon.description : dto.description;
    hackathon.organization_name =
      dto.organization_name ?? hackathon.organization_name;
    hackathon.start_at = startAt;
    hackathon.end_at = endAt;

    return this.hackathonRepository.save(hackathon);
  }
}
