import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  PayloadTooLargeException,
  StreamableFile,
} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { Hackathon } from '../hackathons/entities/hackathon.entity';
import {
  HackathonPhase,
  HackathonPhaseName,
} from '../hackathons/entities/hackathon-phase.entity';
import { HackathonSettings } from '../hackathons/entities/hackathon-settings.entity';
import { StoredFile } from '../../shared/files/entities/stored-file.entity';
import { FileBucket } from '../../shared/files/file-bucket';
import {
  FileManager,
  MAX_FILE_UPLOAD_BYTES,
} from '../../shared/files/file-manager';
import type { UploadFile } from '../../shared/files/file-manager';
import { Team } from './entities/team.entity';
import { TeamMember } from './entities/team-member.entity';
import { TeamSubmission } from './entities/team-submission.entity';
import {
  HackathonUser,
  HackRoleName,
} from '../hackathons/entities/hackathon-user.entity';

@Injectable()
export class TeamSubmissionsService {
  private readonly logger = new Logger(TeamSubmissionsService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly storage: FileManager,
    @Inject(MAX_FILE_UPLOAD_BYTES) private readonly uploadLimit: number,
  ) {}

  private async load(
    manager: EntityManager,
    teamId: number,
    userId: number,
    lock = false,
    allowJudge = false,
  ) {
    const team = await manager.findOneBy(Team, { id: teamId });
    if (!team) throw new NotFoundException('Team not found');
    if (lock) {
      // Match the lock order used for accepting team members. Shared hackathon
      // locks allow separate teams to upload while blocking settings changes.
      await manager.findOneOrFail(Hackathon, {
        where: { id: team.hackathonId },
        lock: { mode: 'pessimistic_read' },
      });
      const lockedTeam = await manager.findOne(Team, {
        where: { id: teamId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!lockedTeam) throw new NotFoundException('Team not found');
    }

    const membership = await manager.existsBy(TeamMember, {
      team: { id: teamId },
      hackathonUser: { user: { id: userId } },
    });
    if (!membership) {
      if (!allowJudge) {
        throw new ForbiddenException('You are not a member of this team');
      }

      const isJudge = await manager.existsBy(HackathonUser, {
        user: { id: userId },
        hackathon: { id: team.hackathonId },
        hackRoleName: HackRoleName.JURY,
      });

      if (!isJudge) {
        throw new ForbiddenException(
          'You are not authorised to access this submission',
        );
      }

      const evaluationPhase = await manager.findOneBy(HackathonPhase, {
        hackathon: { id: team.hackathonId },
        phaseName: HackathonPhaseName.EVALUATION,
      });

      const now = new Date();

      if (
        !evaluationPhase ||
        now < evaluationPhase.startAt ||
        now >= evaluationPhase.endAt
      ) {
        throw new ForbiddenException(
          'Judges can only access submissions during evaluation',
        );
      }
    }

    const scope = {
      team: { id: teamId },
      hackathon: { id: team.hackathonId },
      bucket: FileBucket.SUBMISSION,
    };
    const settings = await manager.findOneBy(HackathonSettings, {
      hackathon: { id: team.hackathonId },
    });
    const phase = await manager.findOneBy(HackathonPhase, {
      hackathon: { id: team.hackathonId },
      phaseName: HackathonPhaseName.IN_PROGRESS,
    });
    const count = await manager.countBy(TeamMember, { team: { id: teamId } });
    const submission = await manager.findOneBy(TeamSubmission, { teamId });
    if (!membership && !submission?.isSubmitted) {
      throw new ForbiddenException(
        'Judges can only access finalised submissions',
      );
    }
    const files = await manager.find(StoredFile, {
      where: scope,
      order: { createdAt: 'ASC', id: 'ASC' },
    });
    return { team, settings, phase, count, submission, files };
  }

  private phaseBlock(
    phase: HackathonPhase | null,
    now = new Date(),
  ): string | null {
    if (!phase || now < phase.startAt || now >= phase.endAt) {
      return 'Submissions can only be changed during the In progress phase.';
    }
    return null;
  }

  private state(context: Awaited<ReturnType<TeamSubmissionsService['load']>>) {
    const { settings, phase, count, submission, files } = context;
    const rosterBlock = !settings
      ? 'Submission settings are unavailable.'
      : count < settings.minTeamMembers || count > settings.maxTeamMembers
        ? `Your team has ${count} members and needs between ${settings.minTeamMembers} and ${settings.maxTeamMembers}.`
        : null;
    const commonBlock = this.phaseBlock(phase) ?? rosterBlock;
    const isSubmitted = submission?.isSubmitted ?? false;
    const filesLimit = settings?.filesLimit ?? 0;
    const fileBlock =
      commonBlock ?? (isSubmitted ? 'Unsubmit before changing files.' : null);
    return {
      submittedAt: submission?.submittedAt ?? null,
      isSubmitted,
      filesLimit,
      fileMaxSize: settings
        ? Math.min(settings.fileMaxSize, this.uploadLimit)
        : 0,
      files: files.map(({ id, name, fileType }) => ({ id, name, fileType })),
      blocked: {
        upload:
          fileBlock ??
          (files.length >= filesLimit
            ? `Your team has reached the ${filesLimit}-file limit.`
            : null),
        delete: fileBlock,
        submit:
          commonBlock ??
          (files.length === 0
            ? 'Upload at least one file before submitting.'
            : null),
        unsubmit: commonBlock,
      },
    };
  }

  async get(teamId: number, userId: number) {
    return this.state(
      await this.load(this.dataSource.manager, teamId, userId, false, true),
    );
  }

  private requireAllowed(reason: string | null): void {
    if (reason) throw new ConflictException(reason);
  }

  private findFile(files: StoredFile[], id: string): StoredFile {
    const file = files.find((entry) => entry.id === id);
    if (!file) throw new NotFoundException('Submission file not found');
    return file;
  }

  async download(teamId: number, userId: number, id: string) {
    const { files } = await this.load(
      this.dataSource.manager,
      teamId,
      userId,
      false,
      true,
    );
    const file = this.findFile(files, id);
    const name = encodeURIComponent(file.name).replace(
      /['()*]/g,
      (character) => '%' + character.charCodeAt(0).toString(16),
    );
    return new StreamableFile(await this.storage.getStream(file), {
      disposition: `attachment; filename*=UTF-8''${name}`,
      type: 'application/octet-stream',
    });
  }

  async upload(teamId: number, userId: number, file: UploadFile | undefined) {
    if (!file) throw new BadRequestException('File is required');
    const cleanup: StoredFile[] = [];
    try {
      return await this.dataSource.transaction(async (manager) => {
        const context = await this.load(manager, teamId, userId, true);
        const state = this.state(context);
        this.requireAllowed(state.blocked.upload);
        if (file.buffer.length > state.fileMaxSize) {
          throw new PayloadTooLargeException(
            `File exceeds the ${state.fileMaxSize}-byte submission limit.`,
          );
        }
        const stored = await this.storage.upload(
          {
            ...file,
            bucket: FileBucket.SUBMISSION,
            teamId,
            hackathonId: context.team.hackathonId,
          },
          manager,
        );
        cleanup.push(stored);
        if (!context.submission) {
          context.submission = await manager.save(
            TeamSubmission,
            manager.create(TeamSubmission, {
              teamId,
              hackathonId: context.team.hackathonId,
              submittedAt: null,
            }),
          );
        }
        this.requireAllowed(this.phaseBlock(context.phase));
        context.files.push(stored);
        return this.state(context);
      });
    } catch (error) {
      const [stored] = cleanup;
      if (stored) {
        try {
          // The rolled-back row should be absent. If commit succeeded despite
          // a connection error, retain the object referenced by that row.
          if (
            !(await this.dataSource.manager.existsBy(StoredFile, {
              id: stored.id,
            }))
          ) {
            await this.storage.delete(stored);
          }
        } catch (cleanupError) {
          this.logger.error(
            `Failed to clean up submission file ${stored.id}`,
            cleanupError,
          );
        }
      }
      throw error;
    }
  }

  async remove(teamId: number, userId: number, id: string) {
    const { file, state } = await this.dataSource.transaction(
      async (manager) => {
        const context = await this.load(manager, teamId, userId, true);
        this.requireAllowed(this.state(context).blocked.delete);
        const file = this.findFile(context.files, id);
        await manager.delete(StoredFile, file.id);
        context.files = context.files.filter((entry) => entry.id !== id);
        return { file, state: this.state(context) };
      },
    );
    try {
      await this.storage.deleteObject(file);
    } catch (error) {
      this.logger.error(`Failed to clean up submission file ${file.id}`, error);
    }
    return state;
  }

  async setSubmitted(teamId: number, userId: number, submitted: boolean) {
    return this.dataSource.transaction(async (manager) => {
      const context = await this.load(manager, teamId, userId, true);
      const state = this.state(context);
      this.requireAllowed(
        submitted ? state.blocked.submit : state.blocked.unsubmit,
      );
      if (state.isSubmitted === submitted) return state;
      const submission =
        context.submission ??
        manager.create(TeamSubmission, {
          teamId,
          hackathonId: context.team.hackathonId,
        });
      submission.submittedAt = submitted ? new Date() : null;
      context.submission = await manager.save(TeamSubmission, submission);
      return this.state(context);
    });
  }
}
