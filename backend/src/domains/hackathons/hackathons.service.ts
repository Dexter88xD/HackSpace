import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Brackets,
  DataSource,
  EntityManager,
  QueryFailedError,
  Repository,
} from 'typeorm';
import { Hackathon } from './entities/hackathon.entity';
import { CreateHackathonDto } from './dto/create-hackathon.dto';
import { UpdateHackathonDto } from './dto/update-hackathon.dto';
import { HackathonSettings } from './entities/hackathon-settings.entity';
import { HackathonFiltersDto } from './dto/hackathons-filters.dto';
import { HackathonUser, HackRoleName } from './entities/hackathon-user.entity';
import { User } from '../users/entities/user.entity';
import { RoleName } from '../users/entities/user-role.entity';
import { HackathonPhaseName } from './entities/hackathon-phase.entity';
import { Team } from '../teams/entities/team.entity';
import { TeamMember } from '../teams/entities/team-member.entity';
import { validatePhaseSchedule } from './utils/validate-phase-schedule';
import { HackathonPhase } from './entities/hackathon-phase.entity';

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

  private async canEditHackathon(
    hackathonId: number,
    userId: number,
    manager?: EntityManager,
  ): Promise<boolean> {
    const userRepository = manager?.getRepository(User) ?? this.userRepository;

    const hackathonUserRepository =
      manager?.getRepository(HackathonUser) ?? this.hackathonUserRepository;

    const user = await userRepository.findOne({
      where: { id: userId },
      relations: { role: true },
    });

    if (!user?.role) {
      return false;
    }

    if (user.role.roleName === RoleName.ROLE_ADMIN) {
      return true;
    }

    const membership = await hackathonUserRepository.findOne({
      where: {
        user: { id: userId },
        hackathon: { id: hackathonId },
        hackRoleName: HackRoleName.ORGANIZER,
      },
    });

    return !!membership;
  }

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
            .orWhere('hackathon.organizationName ILIKE :search');
        }),
        { search: `%${filterQuery.search}%` },
      );
    }

    if (filterQuery.startDate) {
      query.andWhere('hackathon.endAt >= :startDate', {
        startDate: filterQuery.startDate,
      });
    }

    if (filterQuery.endDate) {
      const nextDay = new Date(`${filterQuery.endDate}T00:00:00.000Z`);
      nextDay.setUTCDate(nextDay.getUTCDate() + 1);
      query.andWhere('hackathon.startAt < :nextDay', {
        nextDay,
      });
    }

    if (filterQuery.phase) {
      const now = new Date();
      query
        .innerJoin('hackathon.phases', 'phase')
        .andWhere('phase.phaseName = :phase', { phase: filterQuery.phase })
        .andWhere('phase.startAt <= :now', { now })
        .andWhere('phase.endAt > :now', { now });
    }

    query
      .orderBy('hackathon.startAt', 'ASC')
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
      relations: { phases: true },
    });
    if (!hackathon) {
      throw new NotFoundException('Hackathon not found');
    }
    return hackathon;
  }

  async findMine(userId: number, filterQuery: HackathonFiltersDto) {
    const query = this.hackathonRepository
      .createQueryBuilder('hackathon')
      .innerJoin('hackathon.hackathonUsers', 'membership');
    query.where('membership.user_id = :userId', {
      userId,
    });
    query.andWhere('membership.hackRoleName = :role', {
      role: HackRoleName.ORGANIZER,
    });
    const pageNumber = filterQuery.page ?? 1;
    const pageLimit = filterQuery.limit ?? 12;
    query
      .orderBy('hackathon.startAt', 'ASC')
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
    if (
      !Number.isFinite(startAt.getTime()) ||
      !Number.isFinite(endAt.getTime()) ||
      startAt >= endAt
    ) {
      throw new BadRequestException(
        'Hackathon start date must be before its end date',
      );
    }
    validatePhaseSchedule(dto.phases, startAt, endAt);
    return this.dataSource.transaction(async (manager) => {
      const hackathon = manager.create(Hackathon, {
        title: dto.title,
        description: dto.description ?? null,
        organizationName: dto.organizationName,
        startAt: startAt,
        endAt: endAt,
      });
      const savedHackathon = await manager.save(hackathon);
      const hackathonSettings = manager.create(HackathonSettings, {
        hackathon: savedHackathon,
      });
      await manager.save(hackathonSettings);
      const hackathonUser = manager.create(HackathonUser, {
        user: { id: userId },
        hackathon: savedHackathon,
        hackRoleName: HackRoleName.ORGANIZER,
      });
      await manager.save(hackathonUser);
      const phases = dto.phases.map((phase) =>
        manager.create(HackathonPhase, {
          phaseName: phase.phaseName,
          description: phase.description ?? null,
          startAt: new Date(phase.startAt),
          endAt: new Date(phase.endAt),
          hackathon: savedHackathon,
        }),
      );
      await manager.save(HackathonPhase, phases);

      return manager.findOneOrFail(Hackathon, {
        where: { id: savedHackathon.id },
        relations: { phases: true },
      });
    });
  }

  async update(hackathonId: number, dto: UpdateHackathonDto, userId: number) {
    if (Object.values(dto).every((value) => value === undefined)) {
      throw new BadRequestException(
        'At least one field must be provided for an update',
      );
    }

    if (dto.phases === null) {
      throw new BadRequestException('Phases must be an array when provided');
    }

    if (dto.phases !== undefined) {
      const names = dto.phases.map((phase) => phase.phaseName);

      if (new Set(names).size !== names.length) {
        throw new BadRequestException('Duplicate phase names are not allowed');
      }
    }

    return this.dataSource.transaction(async (manager) => {
      const hackathon = await manager
        .getRepository(Hackathon)
        .createQueryBuilder('hackathon')
        .leftJoinAndSelect('hackathon.phases', 'phase')
        .where('hackathon.id = :hackathonId', { hackathonId })
        .orderBy('phase.startAt', 'ASC')
        .setLock('pessimistic_write', undefined, ['hackathon'])
        .getOne();

      if (!hackathon) {
        throw new NotFoundException('Hackathon not found');
      }

      const canEdit = await this.canEditHackathon(hackathonId, userId, manager);

      if (!canEdit) {
        throw new ForbiddenException('Forbidden');
      }

      const startAt =
        dto.startAt !== undefined ? new Date(dto.startAt) : hackathon.startAt;

      const endAt =
        dto.endAt !== undefined ? new Date(dto.endAt) : hackathon.endAt;

      if (
        !Number.isFinite(startAt.getTime()) ||
        !Number.isFinite(endAt.getTime()) ||
        startAt >= endAt
      ) {
        throw new BadRequestException(
          'Hackathon start date must be before its end date',
        );
      }

      const phasesToValidate = hackathon.phases.map((existingPhase) => {
        const incomingPhase = dto.phases?.find(
          (phase) => phase.phaseName === existingPhase.phaseName,
        );

        return {
          phaseName: existingPhase.phaseName,
          description:
            incomingPhase?.description === undefined
              ? existingPhase.description
              : incomingPhase.description,
          startAt:
            incomingPhase?.startAt ?? existingPhase.startAt.toISOString(),
          endAt: incomingPhase?.endAt ?? existingPhase.endAt.toISOString(),
        };
      });

      validatePhaseSchedule(phasesToValidate, startAt, endAt);

      hackathon.title = dto.title ?? hackathon.title;
      hackathon.description =
        dto.description === undefined ? hackathon.description : dto.description;
      hackathon.organizationName =
        dto.organizationName ?? hackathon.organizationName;
      hackathon.startAt = startAt;
      hackathon.endAt = endAt;

      await manager.save(Hackathon, hackathon);

      if (dto.phases !== undefined) {
        const updatedPhases: HackathonPhase[] = [];

        for (const incomingPhase of dto.phases) {
          const existingPhase = hackathon.phases.find(
            (phase) => phase.phaseName === incomingPhase.phaseName,
          );

          if (!existingPhase) {
            throw new BadRequestException(
              `Phase ${incomingPhase.phaseName} does not exist`,
            );
          }

          existingPhase.description =
            incomingPhase.description === undefined
              ? existingPhase.description
              : incomingPhase.description;

          existingPhase.startAt = new Date(incomingPhase.startAt);
          existingPhase.endAt = new Date(incomingPhase.endAt);

          updatedPhases.push(existingPhase);
        }

        await manager.save(HackathonPhase, updatedPhases);
      }

      return hackathon;
    });
  }

  async getHackathonCurrentPhase(hackathonId: number) {
    const hackathon = await this.hackathonRepository.findOne({
      where: { id: hackathonId },
      relations: { phases: true },
    });

    if (!hackathon) {
      throw new NotFoundException('Hackathon not found');
    }

    const now = new Date();

    const currentPhase = hackathon.phases.find(
      (phase) => new Date(phase.startAt) <= now && new Date(phase.endAt) > now,
    );
    return currentPhase ?? null;
  }

  // Hackathon Registration
  async hackathonRegister(userId: number, hackathonId: number) {
    const hackathon = await this.hackathonRepository.findOne({
      where: { id: hackathonId },
      relations: { phases: true },
    });

    if (!hackathon) {
      throw new NotFoundException('Hackathon not found');
    }

    const registrationPhase = hackathon.phases.find(
      (phase) => phase.phaseName === HackathonPhaseName.REGISTRATION,
    );

    const now = new Date();

    if (
      !registrationPhase ||
      new Date(registrationPhase.startAt) > now ||
      new Date(registrationPhase.endAt) <= now
    ) {
      throw new BadRequestException('Registration is not open');
    }

    const hackathonUserExists = await this.hackathonUserRepository.findOne({
      where: {
        user: { id: userId },
        hackathon: { id: hackathonId },
      },
    });

    if (hackathonUserExists) {
      throw new ConflictException(
        'You are already registered to this hackathon',
      );
    }

    const hackathonUser = this.hackathonUserRepository.create({
      user: { id: userId },
      hackathon,
    });

    try {
      return await this.hackathonUserRepository.save(hackathonUser);
    } catch (error) {
      if (error instanceof QueryFailedError) {
        const driverError = error.driverError as {
          code?: string;
          constraint?: string;
        };

        if (
          driverError.code === '23505' &&
          driverError.constraint === 'UQ_hackathon_users_user_hackathon'
        ) {
          throw new ConflictException(
            'You are already registered to this hackathon',
          );
        }
      }
      throw error;
    }
  }

  async hackathonUnregister(userId: number, hackathonId: number) {
    const hackathon = await this.hackathonRepository.findOne({
      where: { id: hackathonId },
      relations: { phases: true },
    });

    if (!hackathon) {
      throw new NotFoundException('Hackathon not found');
    }

    const registrationPhase = hackathon.phases.find(
      (phase) => phase.phaseName === HackathonPhaseName.REGISTRATION,
    );

    const now = new Date();
    if (
      !registrationPhase ||
      new Date(registrationPhase.startAt) > now ||
      new Date(registrationPhase.endAt) <= now
    ) {
      throw new BadRequestException(
        'The registration period is not currently active',
      );
    }

    const hackathonUser = await this.hackathonUserRepository.findOne({
      where: {
        user: { id: userId },
        hackathon: { id: hackathonId },
      },
    });

    if (!hackathonUser) {
      throw new ConflictException('You are not part of this hackathon');
    }

    if (hackathonUser.hackRoleName !== HackRoleName.PARTICIPANT) {
      throw new ForbiddenException(
        'Only participants can unregister from this hackathon',
      );
    }

    // Removing the registration cascades to the user's team membership. A team
    // left with no members is deleted too.
    await this.dataSource.transaction(async (manager) => {
      const membership = await manager.findOne(TeamMember, {
        where: { hackathonUser: { id: hackathonUser.id } },
        relations: { team: true },
      });

      await manager.remove(hackathonUser);

      if (membership) {
        const remaining = await manager.count(TeamMember, {
          where: { team: { id: membership.team.id } },
        });
        if (remaining === 0) {
          await manager.delete(Team, membership.team.id);
        }
      }
    });

    return {
      message: 'Successfully unregistered from the hackathon',
    };
  }

  async getMembership(userId: number, hackathonId: number) {
    const hackathon = await this.hackathonRepository.findOne({
      where: { id: hackathonId },
    });

    if (!hackathon)
      throw new NotFoundException(
        `Hackathon with ${hackathonId} doesn't exist`,
      );

    const membership = await this.hackathonUserRepository.findOne({
      where: {
        user: { id: userId },
        hackathon: { id: hackathonId },
      },
    });

    return {
      isRegistered: !!membership,
      role: membership?.hackRoleName ?? null,
    };
  }
}
