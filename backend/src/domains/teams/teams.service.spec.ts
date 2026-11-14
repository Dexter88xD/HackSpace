import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, EntityManager, QueryFailedError } from 'typeorm';
import { Hackathon } from '../hackathons/entities/hackathon.entity';
import { HackathonPhaseName } from '../hackathons/entities/hackathon-phase.entity';
import {
  HackathonUser,
  HackRoleName,
} from '../hackathons/entities/hackathon-user.entity';
import { Team } from './entities/team.entity';
import { TeamMember } from './entities/team-member.entity';
import {
  JoinRequestStatus,
  TeamJoinRequest,
} from './entities/team-join-request.entity';
import { TeamsService } from './teams.service';

describe('TeamsService', () => {
  let service: TeamsService;

  const mockTeamRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };
  const mockTeamMemberRepository = { findOne: jest.fn() };
  const mockJoinRequestRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };
  const mockHackathonRepository = { findOne: jest.fn() };
  const mockHackathonUserRepository = { findOne: jest.fn() };
  const mockManager = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    delete: jest.fn(),
  };
  const mockDataSource = { transaction: jest.fn(), manager: mockManager };

  const runTransactions = () =>
    mockDataSource.transaction.mockImplementation(
      (callback: (manager: EntityManager) => Promise<unknown>) =>
        callback(mockManager as unknown as EntityManager),
    );

  // checkLeader reads the oldest member through the entity manager.
  const leaderIs = (userId: number) =>
    mockManager.findOne.mockImplementation((entity: unknown) =>
      Promise.resolve(
        entity === TeamMember
          ? { id: 1, hackathonUser: { user: { id: userId } } }
          : null,
      ),
    );

  const uniqueViolation = (constraint: string) =>
    new QueryFailedError('INSERT', [], {
      code: '23505',
      constraint,
    } as unknown as Error);

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
          provide: getRepositoryToken(TeamJoinRequest),
          useValue: mockJoinRequestRepository,
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
        leaderId: 5,
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

  describe('requestToJoin', () => {
    const openTeam = (overrides: object = {}) => ({
      id: 3,
      hackathon: {
        id: 1,
        endAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        settings: { maxTeamMembers: 2 },
        phases: [],
      },
      members: [{ id: 1 }],
      ...overrides,
    });

    beforeEach(() => {
      mockTeamRepository.findOne.mockResolvedValue(openTeam());
      mockHackathonUserRepository.findOne.mockResolvedValue(registration);
      mockTeamMemberRepository.findOne.mockResolvedValue(null);
      mockJoinRequestRepository.findOne.mockResolvedValue(null);
      mockJoinRequestRepository.create.mockImplementation(
        (data: object) => data,
      );
      mockJoinRequestRepository.save.mockImplementation((data: object) =>
        Promise.resolve({
          id: 10,
          status: JoinRequestStatus.PENDING,
          createdAt: new Date(),
          ...data,
        }),
      );
    });

    it('creates a pending request', async () => {
      const result = await service.requestToJoin(3, 5);

      expect(result).toEqual(
        expect.objectContaining({
          id: 10,
          teamId: 3,
          status: JoinRequestStatus.PENDING,
        }),
      );
    });

    it('throws NotFoundException for an unknown team', async () => {
      mockTeamRepository.findOne.mockResolvedValue(null);

      await expect(service.requestToJoin(99, 5)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ForbiddenException when the user is not a participant', async () => {
      mockHackathonUserRepository.findOne.mockResolvedValue(null);

      await expect(service.requestToJoin(3, 5)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws ConflictException when the user is already in a team (own team included)', async () => {
      mockTeamMemberRepository.findOne.mockResolvedValue({ id: 1 });

      await expect(service.requestToJoin(3, 5)).rejects.toThrow(
        ConflictException,
      );
      expect(mockJoinRequestRepository.save).not.toHaveBeenCalled();
    });

    it('throws ConflictException when the team is full', async () => {
      mockTeamRepository.findOne.mockResolvedValue(
        openTeam({ members: [{ id: 1 }, { id: 2 }] }),
      );

      await expect(service.requestToJoin(3, 5)).rejects.toThrow(
        'This team is full',
      );
    });

    it('throws ConflictException for a duplicate pending request', async () => {
      mockJoinRequestRepository.findOne.mockResolvedValue({ id: 10 });

      await expect(service.requestToJoin(3, 5)).rejects.toThrow(
        'You already requested to join this team',
      );
    });

    it('turns a concurrent duplicate into a ConflictException', async () => {
      mockJoinRequestRepository.save.mockRejectedValue(
        uniqueViolation('UQ_team_join_requests_pending'),
      );

      await expect(service.requestToJoin(3, 5)).rejects.toThrow(
        'You already requested to join this team',
      );
    });

    it('throws BadRequestException outside the registration phase', async () => {
      const team = openTeam();
      team.hackathon.phases = [
        {
          phaseName: HackathonPhaseName.REGISTRATION,
          startAt: new Date(Date.now() - 2000),
          endAt: new Date(Date.now() - 1000),
        },
      ] as never;
      mockTeamRepository.findOne.mockResolvedValue(team);

      await expect(service.requestToJoin(3, 5)).rejects.toThrow(
        'Team registration is not open',
      );
    });

    it('throws BadRequestException when the hackathon has ended', async () => {
      const team = openTeam();
      team.hackathon.endAt = new Date(Date.now() - 1000);
      mockTeamRepository.findOne.mockResolvedValue(team);

      await expect(service.requestToJoin(3, 5)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('cancelRequest', () => {
    it('removes the user’s own pending request', async () => {
      const request = { id: 10, status: JoinRequestStatus.PENDING };
      mockJoinRequestRepository.findOne.mockResolvedValue(request);

      await service.cancelRequest(10, 5);

      expect(mockJoinRequestRepository.findOne).toHaveBeenCalledWith({
        where: { id: 10, hackathonUser: { user: { id: 5 } } },
      });
      expect(mockJoinRequestRepository.remove).toHaveBeenCalledWith(request);
    });

    it("throws NotFoundException for someone else's request", async () => {
      mockJoinRequestRepository.findOne.mockResolvedValue(null);

      await expect(service.cancelRequest(10, 6)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws BadRequestException for an answered request', async () => {
      mockJoinRequestRepository.findOne.mockResolvedValue({
        id: 10,
        status: JoinRequestStatus.ACCEPTED,
      });

      await expect(service.cancelRequest(10, 5)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('acceptRequest', () => {
    const request = {
      id: 10,
      team: {
        id: 3,
        hackathon: {
          id: 1,
          endAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          settings: { maxTeamMembers: 2 },
          phases: [],
        },
      },
      hackathonUser: { id: 8 },
    };

    beforeEach(() => {
      runTransactions();
      leaderIs(5);
      mockJoinRequestRepository.findOne.mockResolvedValue(request);
      mockManager.update.mockResolvedValue({ affected: 1 });
      mockManager.count.mockResolvedValue(1);
      mockManager.create.mockImplementation(
        (_entity: unknown, data: object) => data,
      );
      mockManager.save.mockResolvedValue({});
      mockTeamRepository.findOne.mockResolvedValue(savedTeam);
    });

    it('adds the member, accepts the request and closes their other requests', async () => {
      await service.acceptRequest(10, 5);

      expect(mockManager.findOne).toHaveBeenCalledWith(Team, {
        where: { id: 3 },
        lock: { mode: 'pessimistic_write' },
      });
      expect(mockManager.update).toHaveBeenCalledWith(
        TeamJoinRequest,
        { id: 10, status: JoinRequestStatus.PENDING },
        { status: JoinRequestStatus.ACCEPTED },
      );
      expect(mockManager.create).toHaveBeenCalledWith(TeamMember, {
        team: request.team,
        hackathonUser: request.hackathonUser,
      });
      expect(mockManager.update).toHaveBeenCalledWith(
        TeamJoinRequest,
        { hackathonUser: { id: 8 }, status: JoinRequestStatus.PENDING },
        { status: JoinRequestStatus.REJECTED },
      );
    });

    it('throws ForbiddenException for a user who is not the leader', async () => {
      leaderIs(6);

      await expect(service.acceptRequest(10, 5)).rejects.toThrow(
        ForbiddenException,
      );
      expect(mockManager.save).not.toHaveBeenCalled();
    });

    it('throws ConflictException when the team filled up in the meantime', async () => {
      mockManager.count.mockResolvedValue(2);

      await expect(service.acceptRequest(10, 5)).rejects.toThrow(
        'This team is full',
      );
      expect(mockManager.save).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when the request was already answered', async () => {
      mockManager.update.mockResolvedValue({ affected: 0 });

      await expect(service.acceptRequest(10, 5)).rejects.toThrow(
        'This request was already answered',
      );
      expect(mockManager.save).not.toHaveBeenCalled();
    });

    it('throws ConflictException when the user joined another team concurrently', async () => {
      mockManager.save.mockRejectedValue(
        uniqueViolation('UQ_team_members_hackathon_user'),
      );

      await expect(service.acceptRequest(10, 5)).rejects.toThrow(
        ConflictException,
      );
    });

    it('throws NotFoundException for an unknown request', async () => {
      mockJoinRequestRepository.findOne.mockResolvedValue(null);

      await expect(service.acceptRequest(99, 5)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('rejectRequest', () => {
    beforeEach(() => {
      leaderIs(5);
      mockJoinRequestRepository.findOne.mockResolvedValue({
        id: 10,
        team: { id: 3 },
      });
      mockJoinRequestRepository.update.mockResolvedValue({ affected: 1 });
    });

    it('rejects a pending request', async () => {
      await service.rejectRequest(10, 5);

      expect(mockJoinRequestRepository.update).toHaveBeenCalledWith(
        { id: 10, status: JoinRequestStatus.PENDING },
        { status: JoinRequestStatus.REJECTED },
      );
    });

    it('throws ForbiddenException for a user who is not the leader', async () => {
      leaderIs(6);

      await expect(service.rejectRequest(10, 5)).rejects.toThrow(
        ForbiddenException,
      );
      expect(mockJoinRequestRepository.update).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when the request was already answered', async () => {
      mockJoinRequestRepository.update.mockResolvedValue({ affected: 0 });

      await expect(service.rejectRequest(10, 5)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('removeMember', () => {
    beforeEach(() => {
      runTransactions();
      mockTeamRepository.findOne
        .mockResolvedValueOnce({ id: 3, hackathon })
        .mockResolvedValue(savedTeam);
    });

    it('lets the leader remove a member', async () => {
      const member = { id: 2 };
      mockManager.findOne.mockImplementation(
        (entity: unknown, options: { where: { hackathonUser?: unknown } }) =>
          Promise.resolve(
            entity === TeamMember
              ? options.where.hackathonUser
                ? member
                : { id: 1, hackathonUser: { user: { id: 5 } } }
              : null,
          ),
      );

      await service.removeMember(3, 6, 5);

      expect(mockManager.remove).toHaveBeenCalledWith(member);
    });

    it('throws ForbiddenException for a user who is not the leader', async () => {
      leaderIs(6);

      await expect(service.removeMember(3, 7, 5)).rejects.toThrow(
        ForbiddenException,
      );
      expect(mockManager.remove).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when the leader removes themselves', async () => {
      await expect(service.removeMember(3, 5, 5)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('update and remove', () => {
    beforeEach(() => {
      mockTeamRepository.findOne.mockResolvedValue({
        id: 3,
        name: 'Old',
        description: null,
        hackathon,
      });
    });

    it('lets the leader rename the team', async () => {
      leaderIs(5);
      mockHackathonUserRepository.findOne.mockResolvedValue(null);
      mockTeamRepository.findOne
        .mockResolvedValueOnce({ id: 3, name: 'Old', hackathon })
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(savedTeam);

      await service.update(3, { name: ' New ' }, 5);

      expect(mockTeamRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'New' }),
      );
    });

    it('lets an organizer delete the team', async () => {
      mockHackathonUserRepository.findOne.mockResolvedValue({ id: 1 });

      await service.remove(3, 9);

      expect(mockTeamRepository.delete).toHaveBeenCalledWith(3);
    });

    it('throws ForbiddenException for a member who is not the leader', async () => {
      leaderIs(6);
      mockHackathonUserRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(3, 5)).rejects.toThrow(ForbiddenException);
      await expect(service.update(3, { name: 'X' }, 5)).rejects.toThrow(
        ForbiddenException,
      );
      expect(mockTeamRepository.delete).not.toHaveBeenCalled();
      expect(mockTeamRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('leader succession', () => {
    it('makes the next oldest member leader after the leader leaves', async () => {
      const member = (id: number) => ({
        joinedAt: new Date(),
        hackathonUser: {
          user: { id, username: `u${id}`, fullName: `U ${id}` },
        },
      });
      mockTeamRepository.findOne.mockResolvedValue({
        ...savedTeam,
        members: [member(6), member(7)],
      });

      const result = await service.findOne(3);

      expect(result.leaderId).toBe(6);
    });

    it('deletes the team when the last member leaves', async () => {
      runTransactions();
      const membership = { id: 1, team: { hackathon } };
      mockTeamMemberRepository.findOne.mockResolvedValue(membership);
      mockManager.count.mockResolvedValue(0);

      await service.leave(3, 5);

      expect(mockManager.remove).toHaveBeenCalledWith(membership);
      expect(mockManager.delete).toHaveBeenCalledWith(Team, 3);
    });
  });
});
