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
import { Team } from '../teams/entities/team.entity';
import { Score } from './entities/score.entity';
import { DataSource, In } from 'typeorm';
import { UpsertTeamScoresDto } from './dto/upsert-team-scores.dto';

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

    @InjectRepository(Team)
    private readonly teamRepository: Repository<Team>,

    @InjectRepository(Score)
    private readonly scoreRepository: Repository<Score>,

    private readonly dataSource: DataSource,
  ) {}

  async assignJudge(
    hackathonId: number,
    targetUserId: number,
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
        'Judges cannot be assigned once evaluation begins',
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

  async upsertTeamScores(
    hackathonId: number,
    teamId: number,
    requesterId: number,
    dto: UpsertTeamScoresDto,
  ) {
    const hackathon = await this.hackathonRepository.findOne({
      where: { id: hackathonId },
      relations: { phases: true },
    });

    if (!hackathon) {
      throw new NotFoundException('Hackathon not found');
    }

    const evaluationPhase = hackathon.phases.find(
      (phase) => phase.phaseName === HackathonPhaseName.EVALUATION,
    );

    const now = new Date();

    if (
      !evaluationPhase ||
      new Date(evaluationPhase.startAt) > now ||
      new Date(evaluationPhase.endAt) <= now
    ) {
      throw new BadRequestException('Evaluation is not open');
    }

    const judge = await this.hackathonUserRepository.findOne({
      where: {
        user: { id: requesterId },
        hackathon: { id: hackathonId },
        hackRoleName: HackRoleName.JURY,
      },
    });

    if (!judge) {
      throw new ForbiddenException(
        'You are not assigned as a judge for this hackathon',
      );
    }

    const team = await this.teamRepository.findOne({
      where: {
        id: teamId,
        hackathon: { id: hackathonId },
      },
    });

    if (!team) {
      throw new NotFoundException('Team not found in this hackathon');
    }

    const criterionIds = dto.scores.map((item) => item.criterionId);
    const uniqueIds = new Set(criterionIds);

    if (uniqueIds.size !== criterionIds.length) {
      throw new BadRequestException('Duplicate criterion IDs are not allowed');
    }

    const criteria = await this.criterionRepository.find({
      where: {
        id: In(criterionIds),
        hackathon: { id: hackathonId },
      },
    });

    if (criteria.length !== criterionIds.length) {
      throw new BadRequestException(
        'One or more criteria do not belong to this hackathon',
      );
    }

    await this.dataSource.transaction(async (manager) => {
      const scoreRepository = manager.getRepository(Score);

      for (const item of dto.scores) {
        const existingScore = await scoreRepository.findOne({
          where: {
            judge: { id: judge.id },
            team: { id: team.id },
            criterion: { id: item.criterionId },
          },
        });

        if (existingScore) {
          existingScore.score = item.score;
          await scoreRepository.save(existingScore);
        } else {
          const score = scoreRepository.create({
            judge,
            team,
            criterion: { id: item.criterionId },
            score: item.score,
          });

          await scoreRepository.save(score);
        }
      }
    });

    return this.getMyTeamScores(hackathonId, teamId, requesterId);
  }

  async getMyTeamScores(
    hackathonId: number,
    teamId: number,
    requesterId: number,
  ) {
    const hackathon = await this.hackathonRepository.findOneBy({
      id: hackathonId,
    });

    if (!hackathon) {
      throw new NotFoundException('Hackathon not found');
    }

    const judge = await this.hackathonUserRepository.findOne({
      where: {
        user: { id: requesterId },
        hackathon: { id: hackathonId },
        hackRoleName: HackRoleName.JURY,
      },
    });

    if (!judge) {
      throw new ForbiddenException(
        'You are not assigned as a judge for this hackathon',
      );
    }

    const team = await this.teamRepository.findOne({
      where: {
        id: teamId,
        hackathon: { id: hackathonId },
      },
    });

    if (!team) {
      throw new NotFoundException('Team not found in this hackathon');
    }

    const criteria = await this.criterionRepository.find({
      where: { hackathon: { id: hackathonId } },
      order: { id: 'ASC' },
    });

    const scores = await this.scoreRepository.find({
      where: {
        judge: { id: judge.id },
        team: { id: teamId },
      },
      relations: { criterion: true },
    });

    const scoreMap = new Map(
      scores.map((score) => [score.criterion.id, score.score]),
    );

    const result = criteria.map((criterion) => ({
      criterionId: criterion.id,
      title: criterion.title,
      score: scoreMap.get(criterion.id) ?? null,
    }));

    const scoredCount = result.filter((item) => item.score !== null).length;

    const isComplete = criteria.length > 0 && scoredCount === criteria.length;

    return {
      hackathonId,
      teamId,
      judgeId: judge.id,
      isComplete,
      scoredCount,
      totalCriteria: criteria.length,
      scores: result,
    };
  }

  async getRankings(hackathonId: number, requesterId: number) {
    const hackathon = await this.hackathonRepository.findOne({
      where: { id: hackathonId },
      relations: { phases: true },
    });

    if (!hackathon) {
      throw new NotFoundException('Hackathon not found');
    }

    const evaluationPhase = hackathon.phases.find(
      (phase) => phase.phaseName === HackathonPhaseName.EVALUATION,
    );

    const evaluationEnded =
      evaluationPhase !== undefined &&
      new Date() >= new Date(evaluationPhase.endAt);

    if (!evaluationEnded) {
      const canManage = await this.hackathonsService.canEditHackathon(
        hackathonId,
        requesterId,
      );

      if (!canManage) {
        throw new ForbiddenException('Rankings are not available yet');
      }
    }

    const [teams, criteria, scores] = await Promise.all([
      this.teamRepository.find({
        where: { hackathon: { id: hackathonId } },
        order: { id: 'ASC' },
      }),

      this.criterionRepository.find({
        where: { hackathon: { id: hackathonId } },
      }),

      this.scoreRepository.find({
        where: {
          team: { hackathon: { id: hackathonId } },
          judge: {
            hackathon: { id: hackathonId },
            hackRoleName: HackRoleName.JURY,
          },
          criterion: { hackathon: { id: hackathonId } },
        },
        relations: {
          team: true,
          judge: true,
          criterion: true,
        },
      }),
    ]);

    const criterionIds = new Set(criteria.map((criterion) => criterion.id));

    const evaluations = new Map<number, Map<number, Map<number, number>>>();

    for (const score of scores) {
      if (!criterionIds.has(score.criterion.id)) {
        continue;
      }

      if (!evaluations.has(score.team.id)) {
        evaluations.set(score.team.id, new Map());
      }

      const teamEvaluations = evaluations.get(score.team.id)!;

      if (!teamEvaluations.has(score.judge.id)) {
        teamEvaluations.set(score.judge.id, new Map());
      }

      teamEvaluations.get(score.judge.id)!.set(score.criterion.id, score.score);
    }

    const results = teams.map((team) => {
      const teamEvaluations = evaluations.get(team.id);
      const completedAverages: number[] = [];

      if (teamEvaluations && criterionIds.size > 0) {
        for (const judgeScores of teamEvaluations.values()) {
          if (judgeScores.size !== criterionIds.size) {
            continue;
          }

          const total = [...judgeScores.values()].reduce(
            (sum, score) => sum + score,
            0,
          );

          completedAverages.push(total / criterionIds.size);
        }
      }

      const average =
        completedAverages.length > 0
          ? completedAverages.reduce((sum, score) => sum + score, 0) /
            completedAverages.length
          : null;

      return {
        teamId: team.id,
        teamName: team.name,
        average,
        completedEvaluations: completedAverages.length,
        status: average === null ? 'NOT_EVALUATED' : 'EVALUATED',
      };
    });

    results.sort((a, b) => {
      if (a.average === null && b.average === null) {
        return a.teamId - b.teamId;
      }

      if (a.average === null) return 1;
      if (b.average === null) return -1;

      return b.average - a.average || a.teamId - b.teamId;
    });

    let position = 0;

    return results.map((team) => ({
      rank: team.average === null ? null : ++position,
      teamId: team.teamId,
      teamName: team.teamName,
      averageScore:
        team.average === null ? null : Number(team.average.toFixed(2)),
      completedEvaluations: team.completedEvaluations,
      status: team.status,
    }));
  }
}
