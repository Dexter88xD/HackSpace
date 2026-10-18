import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Brackets, DataSource, EntityManager } from 'typeorm';
import { Hackathon } from '../../database/entities/hackathon.entity';
import { HackathonsService } from './hackathons.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { HackathonSettings } from '../../database/entities/hackathon-settings.entity';
import { HackathonPhaseName } from '../../database/entities/hackathon-phase.entity';

describe('HackathonsService', () => {
  let service: HackathonsService;

  const mockHackathonRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
  const mockManager = {
    create: jest.fn(),
    save: jest.fn(),
  };
  const mockDataSource = {
    transaction: jest.fn(),
  };
  const mockQueryBuilder = {
    andWhere: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    mockQueryBuilder.andWhere.mockReturnThis();
    mockQueryBuilder.innerJoin.mockReturnThis();
    mockQueryBuilder.orderBy.mockReturnThis();
    mockQueryBuilder.addOrderBy.mockReturnThis();
    mockQueryBuilder.skip.mockReturnThis();
    mockQueryBuilder.take.mockReturnThis();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HackathonsService,
        {
          provide: getRepositoryToken(Hackathon),
          useValue: mockHackathonRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<HackathonsService>(HackathonsService);
  });

  describe('findOne', () => {
    it('should return a hackathon when it exists', async () => {
      const hackathon = {
        id: 1,
        title: 'HackSpace Challege',
      };

      mockHackathonRepository.findOne.mockResolvedValue(hackathon);
      const result = await service.findOne(1);
      expect(mockHackathonRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual(hackathon);
    });

    it('should throw NotFoundException when hackathon does not exist', async () => {
      mockHackathonRepository.findOne.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      expect(mockHackathonRepository.findOne).toHaveBeenCalledWith({
        where: { id: 999 },
      });
    });
  });

  describe('update', () => {
    it('should update a hackathon', async () => {
      const hackathon = {
        id: 1,
        title: 'Original Title',
        description: null,
        organization_name: 'HackSpace',
        start_at: new Date('2026-11-01T09:00:00Z'),
        end_at: new Date('2026-11-03T18:00:00Z'),
      };

      mockHackathonRepository.findOne.mockResolvedValue(hackathon);
      mockHackathonRepository.save.mockImplementation((value: Hackathon) =>
        Promise.resolve(value),
      );
      const result = await service.update(1, { title: 'Updated title' });
      expect(mockHackathonRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockHackathonRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Updated title',
        }),
      );
      expect(result.title).toBe('Updated title');
    });

    it('should reject an update with invalid dates', async () => {
      const hackathon = {
        id: 1,
        title: 'Original Title',
        description: null,
        organization_name: 'HackSpace',
        start_at: new Date('2026-11-01T09:00:00Z'),
        end_at: new Date('2026-11-03T18:00:00Z'),
      };

      mockHackathonRepository.findOne.mockResolvedValue(hackathon);
      await expect(
        service.update(1, {
          start_at: '2026-11-10T09:00:00Z',
          end_at: '2026-11-05T09:00:00Z',
        }),
      ).rejects.toThrow(BadRequestException);
      expect(mockHackathonRepository.save).not.toHaveBeenCalled();
    });

    it('should reject updating a nonexistent hackathon', async () => {
      mockHackathonRepository.findOne.mockResolvedValue(null);

      await expect(service.update(999, { title: 'New title' })).rejects.toThrow(
        NotFoundException,
      );
      expect(mockHackathonRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should create a hackathon and its default settings', async () => {
      mockDataSource.transaction.mockImplementation(
        (callback: (manager: EntityManager) => Promise<Hackathon>) =>
          callback(mockManager as unknown as EntityManager),
      );
      mockManager.create.mockImplementation(
        (_entity: unknown, data: unknown): unknown => data,
      );
      mockManager.save.mockImplementation((entity: unknown): Promise<unknown> =>
        Promise.resolve(entity),
      );
      const dto = {
        title: 'AI Challenge',
        description: 'Build an AI application',
        organization_name: 'HackSpace',
        start_at: '2026-11-01T09:00:00Z',
        end_at: '2026-11-03T18:00:00Z',
      };
      const result = await service.create(dto);
      expect(mockDataSource.transaction).toHaveBeenCalledTimes(1);

      expect(mockManager.create).toHaveBeenCalledWith(
        Hackathon,
        expect.objectContaining({
          title: 'AI Challenge',
          organization_name: 'HackSpace',
        }),
      );
      expect(mockManager.create).toHaveBeenCalledTimes(2);
      expect(mockManager.save).toHaveBeenCalledTimes(2);

      expect(mockManager.create).toHaveBeenCalledWith(
        HackathonSettings,
        expect.objectContaining({
          min_team_members: 1,
          max_team_members: 5,
          files_limit: 0,
          file_max_size: 0,
          hackathon: result,
        }),
      );

      expect(result).toEqual(
        expect.objectContaining({
          title: 'AI Challenge',
          organization_name: 'HackSpace',
        }),
      );
    });

    it('should reject creation when dates are invalid', async () => {
      const dto = {
        title: 'Cloud Computing Challenge',
        description: 'Build cloud-native applications',
        organization_name: 'HackSpace',
        start_at: '2026-12-10T09:00:00Z',
        end_at: '2026-12-05T18:00:00Z',
      };

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
      expect(mockDataSource.transaction).not.toHaveBeenCalled();
    });

    it('should reject creation when start and end timestamps are equal', async () => {
      const dto = {
        title: 'Zero Duration Hackathon',
        description: 'Testing a hackathon with identical start and end times',
        organization_name: 'HackSpace',
        start_at: '2026-11-05T09:00:00Z',
        end_at: '2026-11-05T09:00:00Z',
      };

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);

      expect(mockDataSource.transaction).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated hackathons', async () => {
      const hackathons = [
        { id: 1, title: 'AI Challenge' },
        { id: 2, title: 'Cloud Challenge' },
      ];
      mockHackathonRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );
      mockQueryBuilder.getManyAndCount.mockResolvedValue([hackathons, 5]);
      const result = await service.findAll({ page: 2, limit: 2 });
      expect(mockHackathonRepository.createQueryBuilder).toHaveBeenCalledWith(
        'hackathon',
      );

      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(2);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(2);

      expect(result).toEqual({
        data: hackathons,
        total: 5,
        page: 2,
        limit: 2,
      });
    });

    it('should apply the search filter', async () => {
      mockHackathonRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);
      await service.findAll({ search: 'AI' });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        expect.any(Brackets),
        { search: '%AI%' },
      );
    });

    it('should apply the start date filter', async () => {
      mockHackathonRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      const result = await service.findAll({
        startDate: '2026-11-01',
      });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'hackathon.end_at >= :startDate',
        { startDate: '2026-11-01' },
      );

      expect(result).toEqual({
        data: [],
        total: 0,
        page: 1,
        limit: 12,
      });
    });

    it('should apply the end date filter', async () => {
      mockHackathonRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      const result = await service.findAll({
        endDate: '2026-11-05',
      });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'hackathon.start_at < :nextDay',
        {
          nextDay: new Date('2026-11-06T00:00:00.000Z'),
        },
      );

      expect(result).toEqual({
        data: [],
        total: 0,
        page: 1,
        limit: 12,
      });
    });

    it('should apply combined start and end date filters', async () => {
      mockHackathonRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);
      const result = await service.findAll({
        startDate: '2026-11-03',
        endDate: '2026-11-05',
      });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledTimes(2);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'hackathon.end_at >= :startDate',
        { startDate: '2026-11-03' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'hackathon.start_at < :nextDay',
        {
          nextDay: new Date('2026-11-06T00:00:00.000Z'),
        },
      );
      expect(result).toEqual({
        data: [],
        total: 0,
        page: 1,
        limit: 12,
      });
    });

    it('should reject a date range where startDate is after endDate', async () => {
      await expect(
        service.findAll({
          startDate: '2026-11-10',
          endDate: '2026-11-05',
        }),
      ).rejects.toThrow(BadRequestException);
      expect(mockHackathonRepository.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('should allow filtering for a single calendar day', async () => {
      mockHackathonRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);
      await expect(
        service.findAll({
          startDate: '2026-11-05',
          endDate: '2026-11-05',
        }),
      ).resolves.toEqual({
        data: [],
        total: 0,
        page: 1,
        limit: 12,
      });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledTimes(2);
    });

    it('should use default pagination and stable ordering', async () => {
      mockHackathonRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);
      await service.findAll({});
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(12);
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'hackathon.start_at',
        'ASC',
      );
      expect(mockQueryBuilder.addOrderBy).toHaveBeenCalledWith(
        'hackathon.id',
        'ASC',
      );
    });

    it('should filter hackathons by their active phase', async () => {
      mockHackathonRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);
      await service.findAll({
        phase: HackathonPhaseName.REGISTRATION,
      });
      expect(mockQueryBuilder.innerJoin).toHaveBeenCalledWith(
        'hackathon.phases',
        'phase',
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'phase.phase_name = :phase',
        { phase: HackathonPhaseName.REGISTRATION },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'phase.start_at <= :now',
        { now: expect.any(Date) as Date },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'phase.end_at > :now',
        { now: expect.any(Date) as Date },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledTimes(3);
    });

    it('should combine search, date, and phase filters', async () => {
      mockHackathonRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);
      await service.findAll({
        search: 'AI',
        startDate: '2026-11-01',
        endDate: '2026-11-05',
        phase: HackathonPhaseName.IN_PROGRESS,
      });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        expect.any(Brackets),
        { search: '%AI%' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'hackathon.end_at >= :startDate',
        { startDate: '2026-11-01' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'hackathon.start_at < :nextDay',
        { nextDay: new Date('2026-11-06T00:00:00.000Z') },
      );
      expect(mockQueryBuilder.innerJoin).toHaveBeenCalledWith(
        'hackathon.phases',
        'phase',
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'phase.phase_name = :phase',
        { phase: HackathonPhaseName.IN_PROGRESS },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'phase.start_at <= :now',
        { now: expect.any(Date) as Date },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'phase.end_at > :now',
        { now: expect.any(Date) as Date },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledTimes(6);
    });
  });
});
