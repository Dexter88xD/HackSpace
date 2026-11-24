import { ConflictException, Logger } from '@nestjs/common';
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
    delete: jest.Mock;
  };
  let storage: {
    upload: jest.Mock;
    delete: jest.Mock;
    deleteObject: jest.Mock;
  };
  let commit: jest.Mock;
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
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    commit = jest.fn().mockResolvedValue(undefined);
    existsAfterTransaction = jest.fn().mockResolvedValue(false);
    const source = {
      manager: { existsBy: existsAfterTransaction },
      transaction: async (
        operation: (manager: EntityManager) => Promise<unknown>,
      ) => {
        const result = await operation(manager as unknown as EntityManager);
        await commit();
        return result;
      },
    };
    storage = {
      upload: jest.fn().mockResolvedValue(file),
      delete: jest.fn().mockResolvedValue(undefined),
      deleteObject: jest.fn().mockResolvedValue(undefined),
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

  it('leaves the MinIO object intact if the metadata deletion fails to commit', async () => {
    const failure = new Error('Database unavailable');
    manager.find.mockResolvedValue([file]);
    commit.mockRejectedValue(failure);

    await expect(service.remove(1, 5, file.id)).rejects.toBe(failure);
    expect(manager.delete).toHaveBeenCalledWith(StoredFile, file.id);
    expect(storage.deleteObject).not.toHaveBeenCalled();
  });

  it('returns the updated state if MinIO cleanup fails after commit', async () => {
    const failure = new Error('MinIO unavailable');
    const log = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    manager.find.mockResolvedValue([file]);
    storage.deleteObject.mockRejectedValue(failure);

    try {
      await expect(service.remove(1, 5, file.id)).resolves.toMatchObject({
        files: [],
      });
      expect(commit.mock.invocationCallOrder[0]).toBeLessThan(
        storage.deleteObject.mock.invocationCallOrder[0],
      );
      expect(log).toHaveBeenCalledWith(
        expect.stringContaining(file.id),
        failure,
      );
    } finally {
      log.mockRestore();
    }
  });
});
