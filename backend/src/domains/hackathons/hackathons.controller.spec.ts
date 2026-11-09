import { Test, TestingModule } from '@nestjs/testing';
import { HackathonsController } from './hackathons.controller';
import { HackathonsService } from './hackathons.service';
import { HackathonPhaseName } from './entities/hackathon-phase.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';

describe('HackathonsController', () => {
  let controller: HackathonsController;

  const mockHackathonsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    findMine: jest.fn(),
    findDetails: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HackathonsController],
      providers: [
        {
          provide: HackathonsService,
          useValue: mockHackathonsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<HackathonsController>(HackathonsController);
  });

  describe('create', () => {
    it('should pass the DTO and authenticated user ID to the service', async () => {
      const dto = {
        title: 'AI Challenge',
        description: 'Build an AI project',
        organizationName: 'HackSpace',
        startAt: '2026-11-01T09:00:00Z',
        endAt: '2026-11-03T18:00:00Z',
      };
      const mockRequest = {
        user: { userId: 1 },
      } as AuthenticatedRequest;
      const hackathon = { id: 1, title: dto.title };
      mockHackathonsService.create.mockResolvedValue(hackathon);
      const result = await controller.create(dto, mockRequest);
      expect(mockHackathonsService.create).toHaveBeenCalledWith(dto, 1);
      expect(result).toEqual(hackathon);
    });
  });

  describe('findAll', () => {
    it('should pass filters to the service', async () => {
      const filters = {
        search: 'AI',
        page: 2,
        limit: 10,
        phase: HackathonPhaseName.REGISTRATION,
      };
      const response = {
        data: [{ id: 1, title: 'AI Challenge' }],
        total: 1,
        page: 2,
        limit: 10,
      };
      mockHackathonsService.findAll.mockResolvedValue(response);
      const result = await controller.findAll(filters);
      expect(mockHackathonsService.findAll).toHaveBeenCalledWith(filters);
      expect(result).toEqual(response);
    });
  });

  describe('findOne', () => {
    it('should pass the hackathon ID and authenticated user ID to the service', async () => {
      const hackathon = {
        id: 7,
        title: 'Cloud Challenge',
        canEdit: true,
      };

      const mockRequest = {
        user: { userId: 1 },
      } as AuthenticatedRequest;

      mockHackathonsService.findDetails.mockResolvedValue(hackathon);

      const result = await controller.findOne(7, mockRequest);

      expect(mockHackathonsService.findDetails).toHaveBeenCalledWith(7, 1);
      expect(result).toEqual(hackathon);
    });
  });

  describe('update', () => {
    it('should pass the hackathon ID, update DTO, and authenticated user ID to the service', async () => {
      const dto = { title: 'Updated Challenge' };
      const hackathon = { id: 7, title: 'Updated Challenge' };
      const mockRequest = { user: { userId: 1 } } as AuthenticatedRequest;
      mockHackathonsService.update.mockResolvedValue(hackathon);
      const result = await controller.update(7, dto, mockRequest);
      expect(mockHackathonsService.update).toHaveBeenCalledWith(7, dto, 1);
      expect(result).toEqual(hackathon);
    });
  });

  describe('findMine', () => {
    it('should pass the authenticated user ID and filters to the service', async () => {
      const filters = { page: 2, limit: 5 };
      const mockRequest = {
        user: { userId: 7 },
      } as AuthenticatedRequest;

      const response = {
        data: [{ id: 10, title: 'AI Challenge' }],
        total: 1,
        page: 2,
        limit: 5,
      };

      mockHackathonsService.findMine.mockResolvedValue(response);

      const result = await controller.findMine(filters, mockRequest);

      expect(mockHackathonsService.findMine).toHaveBeenCalledWith(7, filters);
      expect(result).toEqual(response);
    });
  });
});
