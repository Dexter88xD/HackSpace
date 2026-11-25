import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  In,
  IsNull,
  Not,
  QueryFailedError,
  Repository,
} from 'typeorm';
import { HackathonsService } from '../hackathons/hackathons.service';
import { Hackathon } from '../hackathons/entities/hackathon.entity';
import {
  HackathonUser,
  HackRoleName,
} from '../hackathons/entities/hackathon-user.entity';
import { User } from '../users/entities/user.entity';
import { CreateScoringCriterionDto } from './dto/create-scoring-criterion.dto';
import {
  HackathonPhase,
  HackathonPhaseName,
} from '../hackathons/entities/hackathon-phase.entity';
import { ScoringCriterion } from './entities/scoring-criterion.entity';
import { Team } from '../teams/entities/team.entity';
import { Score } from './entities/score.entity';
import { UpsertTeamScoresDto } from './dto/upsert-team-scores.dto';
import { TeamSubmission } from '../teams/entities/team-submission.entity';

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

    @InjectRepository(TeamSubmission)
    private readonly submissionRepository: Repository<TeamSubmission>,

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

    const now = new Date();

    const currentPhase = hackathon.phases.find(
      (phase) => now >= new Date(phase.startAt) && now < new Date(phase.endAt),
    );

    if (
      currentPhase?.phaseName !== HackathonPhaseName.LAUNCH &&
      currentPhase?.phaseName !== HackathonPhaseName.REGISTRATION
    ) {
      throw new BadRequestException(
        'Scoring criteria can only be created during launch or registration',
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
    await this.dataSource.transaction(async (manager) => {
      // Protect the evaluation schedule against concurrent modifications.
      const hackathon = await manager.findOne(Hackathon, {
        where: { id: hackathonId },
        lock: { mode: 'pessimistic_read' },
      });

      if (!hackathon) {
        throw new NotFoundException('Hackathon not found');
      }

      const evaluationPhase = await manager.findOneBy(HackathonPhase, {
        hackathon: { id: hackathonId },
        phaseName: HackathonPhaseName.EVALUATION,
      });

      const judge = await manager.findOne(HackathonUser, {
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

      const team = await manager.findOne(Team, {
        where: {
          id: teamId,
          hackathonId,
        },
        lock: { mode: 'pessimistic_read' },
      });

      if (!team) {
        throw new NotFoundException('Team not found in this hackathon');
      }

      const isSubmitted = await manager.existsBy(TeamSubmission, {
        teamId,
        hackathonId,
        submittedAt: Not(IsNull()),
      });

      if (!isSubmitted) {
        throw new BadRequestException(
          'Only teams with finalised submissions can be evaluated',
        );
      }

      const criterionIds = dto.scores.map((item) => item.criterionId);
      const uniqueIds = new Set(criterionIds);

      if (uniqueIds.size !== criterionIds.length) {
        throw new BadRequestException(
          'Duplicate criterion IDs are not allowed',
        );
      }

      const criteria = await manager.find(ScoringCriterion, {
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

      const now = new Date();

      if (
        !evaluationPhase ||
        now < evaluationPhase.startAt ||
        now >= evaluationPhase.endAt
      ) {
        throw new BadRequestException('Evaluation is not open');
      }

      const scoreRepository = manager.getRepository(Score);

      // Use consistent criterion ordering to reduce deadlock risk.
      const sortedScores = [...dto.scores].sort(
        (a, b) => a.criterionId - b.criterionId,
      );

      for (const item of sortedScores) {
        const score = {
          judge: { id: judge.id },
          team: { id: team.id },
          criterion: { id: item.criterionId },
          score: item.score,
        };

        // Omitted comments must not overwrite existing feedback.
        const values =
          item.comment === undefined
            ? score
            : {
                ...score,
                comment: item.comment?.trim() || null,
              };

        // Atomically insert or update each criterion score.
        await scoreRepository.upsert(values, {
          conflictPaths: ['judge', 'team', 'criterion'],
        });
      }
    });

    return this.getMyTeamScores(hackathonId, teamId, requesterId);
  }

  async findEligibleTeams(hackathonId: number, requesterId: number) {
    const hackathon = await this.hackathonRepository.findOne({
      where: { id: hackathonId },
      relations: { phases: true },
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

    const evaluationPhase = hackathon.phases.find(
      (phase) => phase.phaseName === HackathonPhaseName.EVALUATION,
    );

    const now = new Date();

    if (
      !evaluationPhase ||
      now < evaluationPhase.startAt ||
      now >= evaluationPhase.endAt
    ) {
      throw new BadRequestException('Evaluation is not open');
    }

    const [submissions, criteria, scores] = await Promise.all([
      this.submissionRepository.find({
        where: {
          hackathonId,
          submittedAt: Not(IsNull()),
        },
        relations: { team: true },
        order: { teamId: 'ASC' },
      }),

      this.criterionRepository.find({
        where: { hackathon: { id: hackathonId } },
        select: { id: true },
      }),

      this.scoreRepository.find({
        where: {
          judge: { id: judge.id },
          team: { hackathon: { id: hackathonId } },
          criterion: { hackathon: { id: hackathonId } },
        },
        relations: {
          team: true,
          criterion: true,
        },
      }),
    ]);

    const criterionIds = new Set(criteria.map((criterion) => criterion.id));

    const teamScores = new Map<number, Set<number>>();

    // Track the criteria already scored by the requesting judge.
    for (const score of scores) {
      if (!criterionIds.has(score.criterion.id)) {
        continue;
      }

      if (!teamScores.has(score.team.id)) {
        teamScores.set(score.team.id, new Set());
      }

      teamScores.get(score.team.id)!.add(score.criterion.id);
    }

    return submissions.map((submission) => {
      const scoredCount = teamScores.get(submission.teamId)?.size ?? 0;

      return {
        teamId: submission.teamId,
        teamName: submission.team.name,
        submittedAt: submission.submittedAt,
        scoredCount,
        totalCriteria: criteria.length,
        isComplete: criteria.length > 0 && scoredCount === criteria.length,
      };
    });
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

    const isSubmitted = await this.submissionRepository.existsBy({
      teamId,
      hackathonId,
      submittedAt: Not(IsNull()),
    });

    if (!isSubmitted) {
      throw new BadRequestException(
        'Only teams with finalised submissions can be evaluated',
      );
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
      scores.map((score) => [score.criterion.id, score]),
    );

    const result = criteria.map((criterion) => ({
      criterionId: criterion.id,
      title: criterion.title,
      score: scoreMap.get(criterion.id)?.score ?? null,
      comment: scoreMap.get(criterion.id)?.comment ?? null,
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

    const [teams, criteria, scores, submissions] = await Promise.all([
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

      this.submissionRepository.find({
        where: {
          hackathonId,
          submittedAt: Not(IsNull()),
        },
        select: { teamId: true },
      }),
    ]);

    const submittedTeamIds = new Set(
      submissions.map((submission) => submission.teamId),
    );

    const eligibleTeams = teams.filter((team) => submittedTeamIds.has(team.id));

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

    const results = eligibleTeams.map((team) => {
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
          ? Number(
              (
                completedAverages.reduce((sum, score) => sum + score, 0) /
                completedAverages.length
              ).toFixed(2),
            )
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
    let rank = 0;
    let previousAverage: number | null = null;

    return results.map((team) => {
      if (team.average !== null) {
        position++;

        if (team.average !== previousAverage) {
          rank = position;
        }

        previousAverage = team.average;
      }

      return {
        rank: team.average === null ? null : rank,
        teamId: team.teamId,
        teamName: team.teamName,
        averageScore: team.average,
        completedEvaluations: team.completedEvaluations,
        status: team.status,
      };
    });
  }
}
