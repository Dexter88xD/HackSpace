import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { HackathonsService } from '../hackathons/hackathons.service';
import { Hackathon } from '../hackathons/entities/hackathon.entity';
import {
  HackathonUser,
  HackRoleName,
} from '../hackathons/entities/hackathon-user.entity';
import { User } from '../users/entities/user.entity';
import { CreateScoringCriterionDto } from './dto/create-scoring-criterion.dto';
import { HackathonPhaseName } from '../hackathons/entities/hackathon-phase.entity';
import { ScoringCriterion } from './entities/scoring-criterion.entity';

@Injectable()
export class JuryService {
  constructor(
    private readonly hackathonsService: HackathonsService,

    @InjectRepository(Hackathon)
    private readonly hackathonRepository: Repository<Hackathon>,

    @InjectRepository(HackathonUser)
    private readonly hackathonUserRepository: Repository<HackathonUser>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(ScoringCriterion)
    private readonly criterionRepository: Repository<ScoringCriterion>,
  ) {}

  async assignJudge(
    hackathonId: number,
    targetUserId: number,
    requesterId: number,
  ) {
    const hackathon = await this.hackathonRepository.findOneBy({
      id: hackathonId,
    });

    if (!hackathon) {
      throw new NotFoundException('Hackathon not found');
    }

    const canManage = await this.hackathonsService.canEditHackathon(
      hackathonId,
      requesterId,
    );

    if (!canManage) {
      throw new ForbiddenException(
        'You are not authorised to manage this hackathon',
      );
    }

    const targetUser = await this.userRepository.findOneBy({
      id: targetUserId,
    });

    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    const existingMembership = await this.hackathonUserRepository.findOne({
      where: {
        user: { id: targetUserId },
        hackathon: { id: hackathonId },
      },
    });

    if (existingMembership) {
      throw new ConflictException(
        existingMembership.hackRoleName === HackRoleName.JURY
          ? 'User is already assigned as a judge'
          : 'User already has a different role in this hackathon',
      );
    }

    const judge = this.hackathonUserRepository.create({
      user: targetUser,
      hackathon,
      hackRoleName: HackRoleName.JURY,
    });

    try {
      const savedJudge = await this.hackathonUserRepository.save(judge);

      return {
        id: savedJudge.id,
        userId: targetUserId,
        hackathonId,
        role: savedJudge.hackRoleName,
      };
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
          throw new ConflictException('User already belongs to this hackathon');
        }
      }

      throw error;
    }
  }

  async findJudges(hackathonId: number) {
    const hackathon = await this.hackathonRepository.findOneBy({
      id: hackathonId,
    });

    if (!hackathon) {
      throw new NotFoundException('Hackathon not found');
    }

    const judges = await this.hackathonUserRepository.find({
      where: {
        hackathon: { id: hackathonId },
        hackRoleName: HackRoleName.JURY,
      },
      relations: { user: true },
      order: { id: 'ASC' },
    });

    return judges.map((judge) => ({
      id: judge.id,
      userId: judge.user.id,
      username: judge.user.username,
    }));
  }

  async createCriterion(
    hackathonId: number,
    dto: CreateScoringCriterionDto,
    requesterId: number,
  ) {
    const hackathon = await this.hackathonRepository.findOne({
      where: { id: hackathonId },
      relations: { phases: true },
    });

    if (!hackathon) {
      throw new NotFoundException('Hackathon not found');
    }

    const canManage = await this.hackathonsService.canEditHackathon(
      hackathonId,
      requesterId,
    );

    if (!canManage) {
      throw new ForbiddenException(
        'You are not authorised to manage this hackathon',
      );
    }

    const evaluationPhase = hackathon.phases.find(
      (phase) => phase.phaseName === HackathonPhaseName.EVALUATION,
    );

    if (evaluationPhase && new Date() >= new Date(evaluationPhase.startAt)) {
      throw new BadRequestException(
        'Scoring criteria cannot be changed once evaluation begins',
      );
    }

    const title = dto.title.trim();

    if (!title) {
      throw new BadRequestException('Criterion title cannot be empty');
    }

    const existingCriterion = await this.criterionRepository.findOne({
      where: {
        hackathon: { id: hackathonId },
        title,
      },
    });

    if (existingCriterion) {
      throw new ConflictException(
        'A scoring criterion with this title already exists',
      );
    }

    const criterion = this.criterionRepository.create({
      title,
      description: dto.description ?? null,
      hackathon,
    });

    try {
      const saved = await this.criterionRepository.save(criterion);

      return {
        id: saved.id,
        hackathonId,
        title: saved.title,
        description: saved.description,
      };
    } catch (error) {
      if (error instanceof QueryFailedError) {
        const driverError = error.driverError as {
          code?: string;
          constraint?: string;
        };

        if (
          driverError.code === '23505' &&
          driverError.constraint === 'UQ_scoring_criteria_hackathon_title'
        ) {
          throw new ConflictException(
            'A scoring criterion with this title already exists',
          );
        }
      }

      throw error;
    }
  }

  async findCriteria(hackathonId: number) {
    const hackathon = await this.hackathonRepository.findOneBy({
      id: hackathonId,
    });

    if (!hackathon) {
      throw new NotFoundException('Hackathon not found');
    }

    const criteria = await this.criterionRepository.find({
      where: {
        hackathon: { id: hackathonId },
      },
      order: { id: 'ASC' },
    });

    return criteria.map((criterion) => ({
      id: criterion.id,
      hackathonId,
      title: criterion.title,
      description: criterion.description,
    }));
  }
}
