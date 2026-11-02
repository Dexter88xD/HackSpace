import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, Repository } from 'typeorm';
import { Hackathon } from '../../database/entities/hackathon.entity';
import { CreateHackathonDto } from './dto/create-hackathon.dto';
import { UpdateHackathonDto } from './dto/update-hackathon.dto';
import { HackathonSettings } from '../../database/entities/hackathon-settings.entity';
import { HackathonFiltersDto } from './dto/hackathons-filters.dto';
import {
  HackathonUser,
  HackRoleName,
} from '../../database/entities/hackathon-user.entity';
import { User } from '../../database/entities/user.entity';
import { RoleName } from '../../database/entities/user-role.entity';

@Injectable()
export class HackathonsService {
  constructor(
    @InjectRepository(Hackathon)
    private readonly hackathonRepository: Repository<Hackathon>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(HackathonUser)
    private readonly hackathonUserRepository: Repository<HackathonUser>,

    private readonly dataSource: DataSource,
  ) {}

  async findAll(filterQuery: HackathonFiltersDto) {
    if (
      filterQuery.startDate &&
      filterQuery.endDate &&
      filterQuery.startDate > filterQuery.endDate
    ) {
      throw new BadRequestException(
        'startDate must be before or equal to endDate',
      );
    }
    const query = this.hackathonRepository.createQueryBuilder('hackathon');
    const pageNumber = filterQuery.page ?? 1;
    const pageLimit = filterQuery.limit ?? 12;

    if (filterQuery.search) {
      query.andWhere(
        new Brackets((qb) => {
          qb.where('hackathon.title ILIKE :search')
            .orWhere('hackathon.description ILIKE :search')
            .orWhere('hackathon.organization_name ILIKE :search');
        }),
        { search: `%${filterQuery.search}%` },
      );
    }

    if (filterQuery.startDate) {
      query.andWhere('hackathon.end_at >= :startDate', {
        startDate: filterQuery.startDate,
      });
    }

    if (filterQuery.endDate) {
      const nextDay = new Date(`${filterQuery.endDate}T00:00:00.000Z`);
      nextDay.setUTCDate(nextDay.getUTCDate() + 1);
      query.andWhere('hackathon.start_at < :nextDay', {
        nextDay,
      });
    }

    if (filterQuery.phase) {
      const now = new Date();
      query
        .innerJoin('hackathon.phases', 'phase')
        .andWhere('phase.phase_name = :phase', { phase: filterQuery.phase })
        .andWhere('phase.start_at <= :now', { now })
        .andWhere('phase.end_at > :now', { now });
    }

    query
      .orderBy('hackathon.start_at', 'ASC')
      .addOrderBy('hackathon.id', 'ASC')
      .skip((pageNumber - 1) * pageLimit)
      .take(pageLimit);

    const [data, total] = await query.getManyAndCount();
    return {
      data,
      total,
      page: pageNumber,
      limit: pageLimit,
    };
  }

  async findOne(hackathonId: number) {
    const hackathon = await this.hackathonRepository.findOne({
      where: { id: hackathonId },
    });
    if (!hackathon) {
      throw new NotFoundException('Hackathon not found');
    }
    return hackathon;
  }

  async findMine(userId: number, filterQuery: HackathonFiltersDto) {
    const query = this.hackathonRepository
      .createQueryBuilder('hackathon')
      .innerJoin('hackathon.hackathon_users', 'membership');
    query.where('membership.user_id = :userId', {
      userId,
    });
    query.andWhere('membership.hack_role_name = :role', {
      role: HackRoleName.ORGANIZER,
    });
    const pageNumber = filterQuery.page ?? 1;
    const pageLimit = filterQuery.limit ?? 12;
    query
      .orderBy('hackathon.start_at', 'ASC')
      .addOrderBy('hackathon.id', 'ASC')
      .skip((pageNumber - 1) * pageLimit)
      .take(pageLimit);

    const [data, total] = await query.getManyAndCount();
    return {
      data,
      total,
      page: pageNumber,
      limit: pageLimit,
    };
  }

  async findDetails(hackathonId: number, userId: number) {
    const hackathon = await this.findOne(hackathonId);

    const canEdit = await this.canEditHackathon(hackathonId, userId);

    return {
      ...hackathon,
      canEdit,
    };
  }

  async create(dto: CreateHackathonDto, userId: number) {
    const startAt = new Date(dto.startAt);
    const endAt = new Date(dto.endAt);
    if (startAt >= endAt) {
      throw new BadRequestException('Hackathon dates are incorrect');
    }
    return this.dataSource.transaction(async (manager) => {
      const hackathon = manager.create(Hackathon, {
        title: dto.title,
        description: dto.description ?? null,
        organization_name: dto.organizationName,
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
      const hackathonUser = manager.create(HackathonUser, {
        user: { id: userId },
        hackathon: savedHackathon,
        hack_role_name: HackRoleName.ORGANIZER,
      });
      await manager.save(hackathonUser);
      return savedHackathon;
    });
  }

  async update(hackathonId: number, dto: UpdateHackathonDto, userId: number) {
    const hackathon = await this.findOne(hackathonId);
    const canEdit = await this.canEditHackathon(hackathonId, userId);
    if (!canEdit) {
      throw new ForbiddenException('Forbidden');
    }
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException(
        'At least one field must be provided for an update',
      );
    }
    const startAt = dto.startAt ? new Date(dto.startAt) : hackathon.start_at;
    const endAt = dto.endAt ? new Date(dto.endAt) : hackathon.end_at;
    if (startAt >= endAt) {
      throw new BadRequestException('Hackathon dates are incorrect');
    }
    hackathon.title = dto.title ?? hackathon.title;
    hackathon.description =
      dto.description === undefined ? hackathon.description : dto.description;
    hackathon.organization_name =
      dto.organizationName ?? hackathon.organization_name;
    hackathon.start_at = startAt;
    hackathon.end_at = endAt;

    return this.hackathonRepository.save(hackathon);
  }

  private async canEditHackathon(
    hackathonId: number,
    userId: number,
  ): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: { role: true },
    });

    if (!user?.role) {
      return false;
    }

    if (user.role.role_name === RoleName.ROLE_ADMIN) {
      return true;
    }

    const membership = await this.hackathonUserRepository.findOne({
      where: {
        user: { id: userId },
        hackathon: { id: hackathonId },
        hack_role_name: HackRoleName.ORGANIZER,
      },
    });

    return !!membership;
  }
}
