import { ConflictException } from '@nestjs/common';
import type { DataSource, EntityManager } from 'typeorm';
import { HackathonPhase } from '../hackathons/entities/hackathon-phase.entity';
import { HackathonSettings } from '../hackathons/entities/hackathon-settings.entity';
import type { FileManager } from '../../shared/files/file-manager';
import { StoredFile } from '../../shared/files/entities/stored-file.entity';
import { Team } from './entities/team.entity';
import { TeamSubmission } from './entities/team-submission.entity';
import { TeamSubmissionsService } from './team-submissions.service';

describe('Team submission storage failures', () => {
  const file = Object.assign(new StoredFile(), { id: 'test-file' });
  const upload = {
    buffer: Buffer.from('hello'),
    mimetype: 'text/plain',
    originalname: 'draft.txt',
  };
  let phase: Pick<HackathonPhase, 'startAt' | 'endAt'>;
  let manager: {
    findOneBy: jest.Mock;
    findOneOrFail: jest.Mock;
    findOne: jest.Mock;
    existsBy: jest.Mock;
    countBy: jest.Mock;
    find: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let storage: { upload: jest.Mock; delete: jest.Mock };
  let existsAfterTransaction: jest.Mock;
  let service: TeamSubmissionsService;

  beforeEach(() => {
    const team = { id: 1, hackathonId: 2 };
    phase = {
      startAt: new Date(Date.now() - 60_000),
      endAt: new Date(Date.now() + 60_000),
    };
    const submission = Object.assign(new TeamSubmission(), {
      submittedAt: null,
    });
    manager = {
      findOneBy: jest.fn((entity: unknown) => {
        if (entity === Team) return team;
        if (entity === HackathonPhase) return phase;
        if (entity === HackathonSettings) {
          return {
            minTeamMembers: 1,
            maxTeamMembers: 2,
            filesLimit: 2,
            fileMaxSize: 32,
          };
        }
        return entity === TeamSubmission ? submission : null;
      }),
      findOne: jest.fn().mockResolvedValue(team),
      findOneOrFail: jest.fn().mockResolvedValue({ id: 2 }),
      existsBy: jest.fn().mockResolvedValue(true),
      countBy: jest.fn().mockResolvedValue(1),
      find: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      save: jest.fn(),
    };
    existsAfterTransaction = jest.fn().mockResolvedValue(false);
    const source = {
      manager: { existsBy: existsAfterTransaction },
      transaction: (operation: (manager: EntityManager) => Promise<unknown>) =>
        operation(manager as unknown as EntityManager),
    };
    storage = {
      upload: jest.fn().mockResolvedValue(file),
      delete: jest.fn().mockResolvedValue(undefined),
    };
    service = new TeamSubmissionsService(
      source as unknown as DataSource,
      storage as unknown as FileManager,
      32,
    );
  });

  it('removes the uploaded object if the phase ends before commit', async () => {
    storage.upload.mockImplementation(() => {
      phase.endAt = new Date();
      return Promise.resolve(file);
    });

    await expect(service.upload(1, 5, upload)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(storage.delete).toHaveBeenCalledWith(file);
  });

  it('keeps the object if its metadata survived a transaction error', async () => {
    existsAfterTransaction.mockResolvedValue(true);
    storage.upload.mockImplementation(() => {
      phase.endAt = new Date();
      return Promise.resolve(file);
    });

    await expect(service.upload(1, 5, upload)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(storage.delete).not.toHaveBeenCalled();
  });

  it('propagates a storage deletion failure so the file can be retried', async () => {
    const failure = new Error('MinIO unavailable');
    manager.find.mockResolvedValue([file]);
    storage.delete.mockRejectedValue(failure);

    await expect(service.remove(1, 5, file.id)).rejects.toBe(failure);
    expect(storage.delete).toHaveBeenCalledWith(file, manager);
  });
});
