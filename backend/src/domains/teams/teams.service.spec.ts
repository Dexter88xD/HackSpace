import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, EntityManager } from 'typeorm';
import { Hackathon } from '../../database/entities/hackathon.entity';
import {
  HackathonUser,
  HackRoleName,
} from '../../database/entities/hackathon-user.entity';
import { Team } from '../../database/entities/team.entity';
import { TeamMember } from '../../database/entities/team-member.entity';
import { TeamsService } from './teams.service';

describe('TeamsService', () => {
  let service: TeamsService;

  const mockTeamRepository = { findOne: jest.fn() };
  const mockTeamMemberRepository = { findOne: jest.fn() };
  const mockHackathonRepository = { findOne: jest.fn() };
  const mockHackathonUserRepository = { findOne: jest.fn() };
  const mockManager = { create: jest.fn(), save: jest.fn() };
  const mockDataSource = { transaction: jest.fn() };

  const hackathon = {
    id: 1,
    endAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  };
  const registration = { id: 7 };
  const savedTeam = {
    id: 3,
    name: 'Team Rocket',
    description: null,
    createdAt: new Date('2026-11-01T10:00:00Z'),
    hackathon: {
      id: 1,
      settings: { minTeamMembers: 2, maxTeamMembers: 4 },
    },
    members: [
      {
        joinedAt: new Date('2026-11-01T10:00:00Z'),
        hackathonUser: {
          user: {
            id: 5,
            username: 'saad',
            fullName: 'Saad M',
            passwordHash: 'secret',
          },
        },
      },
    ],
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeamsService,
        { provide: getRepositoryToken(Team), useValue: mockTeamRepository },
        {
          provide: getRepositoryToken(TeamMember),
          useValue: mockTeamMemberRepository,
        },
        {
          provide: getRepositoryToken(Hackathon),
          useValue: mockHackathonRepository,
        },
        {
          provide: getRepositoryToken(HackathonUser),
          useValue: mockHackathonUserRepository,
        },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<TeamsService>(TeamsService);
  });

  describe('create', () => {
    beforeEach(() => {
      mockHackathonRepository.findOne.mockResolvedValue(hackathon);
      mockHackathonUserRepository.findOne.mockResolvedValue(registration);
      mockTeamMemberRepository.findOne.mockResolvedValue(null);
      mockDataSource.transaction.mockImplementation(
        (callback: (manager: EntityManager) => Promise<unknown>) =>
          callback(mockManager as unknown as EntityManager),
      );
      mockManager.create.mockImplementation(
        (_entity: unknown, data: object) => data,
      );
      mockManager.save.mockImplementation((data: object) =>
        Promise.resolve({ id: 3, ...data }),
      );
    });

    it('creates the team with the creator as first member', async () => {
      mockTeamRepository.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(savedTeam);

      const result = await service.create(
        1,
        { name: '  Team Rocket ', description: '  ' },
        5,
      );

      expect(mockHackathonUserRepository.findOne).toHaveBeenCalledWith({
        where: {
          user: { id: 5 },
          hackathon: { id: 1 },
          hackRoleName: HackRoleName.PARTICIPANT,
        },
      });
      expect(mockManager.create).toHaveBeenCalledWith(Team, {
        name: 'Team Rocket',
        description: null,
        hackathon,
      });
      expect(mockManager.create).toHaveBeenCalledWith(TeamMember, {
        team: expect.objectContaining({ id: 3 }) as Team,
        hackathonUser: registration,
      });
      expect(result).toEqual({
        id: 3,
        name: 'Team Rocket',
        description: null,
        createdAt: savedTeam.createdAt,
        hackathonId: 1,
        minMembers: 2,
        maxMembers: 4,
        members: [
          {
            userId: 5,
            username: 'saad',
            fullName: 'Saad M',
            joinedAt: savedTeam.members[0].joinedAt,
          },
        ],
      });
      expect(JSON.stringify(result)).not.toContain('secret');
    });

    it('throws NotFoundException when the hackathon does not exist', async () => {
      mockHackathonRepository.findOne.mockResolvedValue(null);

      await expect(service.create(99, { name: 'A' }, 5)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws BadRequestException when the hackathon has ended', async () => {
      mockHackathonRepository.findOne.mockResolvedValue({
        id: 1,
        endAt: new Date(Date.now() - 1000),
      });

      await expect(service.create(1, { name: 'A' }, 5)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws ForbiddenException when the user is not a registered participant', async () => {
      mockHackathonUserRepository.findOne.mockResolvedValue(null);

      await expect(service.create(1, { name: 'A' }, 5)).rejects.toThrow(
        ForbiddenException,
      );
      expect(mockDataSource.transaction).not.toHaveBeenCalled();
    });

    it('throws ConflictException when the user is already in a team', async () => {
      mockTeamMemberRepository.findOne.mockResolvedValue({ id: 1 });

      await expect(service.create(1, { name: 'A' }, 5)).rejects.toThrow(
        ConflictException,
      );
      expect(mockDataSource.transaction).not.toHaveBeenCalled();
    });

    it('throws ConflictException when the team name is taken', async () => {
      mockTeamRepository.findOne.mockResolvedValue({ id: 2 });

      await expect(service.create(1, { name: 'A' }, 5)).rejects.toThrow(
        ConflictException,
      );
      expect(mockDataSource.transaction).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException when the team does not exist', async () => {
      mockTeamRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findMine', () => {
    it('returns null when the user has no team', async () => {
      mockHackathonRepository.findOne.mockResolvedValue(hackathon);
      mockTeamMemberRepository.findOne.mockResolvedValue(null);

      await expect(service.findMine(1, 5)).resolves.toEqual({ team: null });
    });

    it("returns the user's team", async () => {
      mockHackathonRepository.findOne.mockResolvedValue(hackathon);
      mockTeamMemberRepository.findOne.mockResolvedValue({ team: { id: 3 } });
      mockTeamRepository.findOne.mockResolvedValue(savedTeam);

      const result = await service.findMine(1, 5);

      expect(result.team?.id).toBe(3);
    });

    it('throws NotFoundException when the hackathon does not exist', async () => {
      mockHackathonRepository.findOne.mockResolvedValue(null);

      await expect(service.findMine(99, 5)).rejects.toThrow(NotFoundException);
    });
  });
});
