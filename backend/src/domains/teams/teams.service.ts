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
  EntityManager,
  QueryFailedError,
  Repository,
} from 'typeorm';
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
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';

@Injectable()
export class TeamsService {
  constructor(
    @InjectRepository(Team)
    private readonly teamRepository: Repository<Team>,

    @InjectRepository(TeamMember)
    private readonly teamMemberRepository: Repository<TeamMember>,

    @InjectRepository(TeamJoinRequest)
    private readonly joinRequestRepository: Repository<TeamJoinRequest>,

    @InjectRepository(Hackathon)
    private readonly hackathonRepository: Repository<Hackathon>,

    @InjectRepository(HackathonUser)
    private readonly hackathonUserRepository: Repository<HackathonUser>,

    private readonly dataSource: DataSource,
  ) {}

  async create(hackathonId: number, dto: CreateTeamDto, userId: number) {
    const hackathon = await this.findHackathon(hackathonId);
    if (hackathon.endAt <= new Date()) {
      throw new BadRequestException('This hackathon has ended');
    }

    const registration = await this.findParticipantWithoutTeam(
      hackathonId,
      userId,
      'Only registered participants can create a team',
    );

    const name = dto.name.trim();
    const sameName = await this.teamRepository.findOne({
      where: { hackathon: { id: hackathonId }, name },
    });
    if (sameName) {
      throw new ConflictException('A team with this name already exists');
    }

    // The team and its first member are saved together: if one insert fails,
    // neither row is kept.
    let team: Team;
    try {
      team = await this.dataSource.transaction(async (manager) => {
        const savedTeam = await manager.save(
          manager.create(Team, {
            name,
            description: dto.description?.trim() || null,
            hackathon,
          }),
        );
        await manager.save(
          manager.create(TeamMember, {
            team: savedTeam,
            hackathonUser: registration,
          }),
        );
        return savedTeam;
      });
    } catch (error) {
      throw this.toConflict(error);
    }

    return this.findOne(team.id);
  }

  async findAll(hackathonId: number) {
    const hackathon = await this.hackathonRepository.findOne({
      where: { id: hackathonId },
      relations: { settings: true },
    });
    if (!hackathon) {
      throw new NotFoundException('Hackathon not found');
    }

    const teams = await this.teamRepository.find({
      where: { hackathon: { id: hackathonId } },
      relations: { members: true },
      order: { createdAt: 'ASC' },
    });

    return teams.map((team) => ({
      id: team.id,
      name: team.name,
      description: team.description,
      memberCount: team.members.length,
      maxMembers: hackathon.settings.maxTeamMembers,
    }));
  }

  async update(teamId: number, dto: UpdateTeamDto, userId: number) {
    const team = await this.findTeam(teamId);
    await this.checkLeaderOrOrganizer(team, userId);

    if (dto.name !== undefined) {
      const name = dto.name.trim();
      const sameName = await this.teamRepository.findOne({
        where: { hackathon: { id: team.hackathon.id }, name },
      });
      if (sameName && sameName.id !== teamId) {
        throw new ConflictException('A team with this name already exists');
      }
      team.name = name;
    }
    if (dto.description !== undefined) {
      team.description = dto.description?.trim() || null;
    }

    try {
      await this.teamRepository.save(team);
    } catch (error) {
      throw this.toConflict(error);
    }

    return this.findOne(teamId);
  }

  async remove(teamId: number, userId: number) {
    const team = await this.findTeam(teamId);
    await this.checkLeaderOrOrganizer(team, userId);

    // Members and join requests are deleted with the team (ON DELETE CASCADE).
    await this.teamRepository.delete(teamId);

    return { message: 'Team deleted' };
  }

  async requestToJoin(teamId: number, userId: number) {
    const team = await this.teamRepository.findOne({
      where: { id: teamId },
      relations: { hackathon: { settings: true, phases: true }, members: true },
    });
    if (!team) {
      throw new NotFoundException('Team not found');
    }
    this.checkRegistrationOpen(team.hackathon);

    // A member of this team (the leader included) is already in a team, so
    // this also stops users from requesting to join their own team.
    const registration = await this.findParticipantWithoutTeam(
      team.hackathon.id,
      userId,
      'Only registered participants can request to join a team',
    );

    if (team.members.length >= team.hackathon.settings.maxTeamMembers) {
      throw new ConflictException('This team is full');
    }

    const pending = await this.joinRequestRepository.findOne({
      where: {
        team: { id: teamId },
        hackathonUser: { id: registration.id },
        status: JoinRequestStatus.PENDING,
      },
    });
    if (pending) {
      throw new ConflictException('You already requested to join this team');
    }

    let request: TeamJoinRequest;
    try {
      request = await this.joinRequestRepository.save(
        this.joinRequestRepository.create({
          team,
          hackathonUser: registration,
        }),
      );
    } catch (error) {
      throw this.toConflict(error);
    }

    return {
      id: request.id,
      teamId,
      status: request.status,
      createdAt: request.createdAt,
    };
  }

  async findMyRequests(hackathonId: number, userId: number) {
    await this.findHackathon(hackathonId);

    const requests = await this.joinRequestRepository.find({
      where: {
        status: JoinRequestStatus.PENDING,
        hackathonUser: {
          user: { id: userId },
          hackathon: { id: hackathonId },
        },
      },
      relations: { team: true },
      order: { createdAt: 'ASC' },
    });

    return requests.map((request) => ({
      id: request.id,
      teamId: request.team.id,
      status: request.status,
      createdAt: request.createdAt,
    }));
  }

  async cancelRequest(requestId: number, userId: number) {
    const request = await this.joinRequestRepository.findOne({
      where: { id: requestId, hackathonUser: { user: { id: userId } } },
    });
    if (!request) {
      throw new NotFoundException('Join request not found');
    }
    if (request.status !== JoinRequestStatus.PENDING) {
      throw new BadRequestException('This request was already answered');
    }

    await this.joinRequestRepository.remove(request);

    return { message: 'Join request cancelled' };
  }

  async findRequests(teamId: number, userId: number) {
    await this.findTeam(teamId);
    await this.checkLeader(this.dataSource.manager, teamId, userId);

    const requests = await this.joinRequestRepository.find({
      where: { team: { id: teamId }, status: JoinRequestStatus.PENDING },
      relations: { hackathonUser: { user: true } },
      order: { createdAt: 'ASC' },
    });

    return requests.map((request) => ({
      id: request.id,
      userId: request.hackathonUser.user.id,
      username: request.hackathonUser.user.username,
      fullName: request.hackathonUser.user.fullName,
      createdAt: request.createdAt,
    }));
  }

  async acceptRequest(requestId: number, userId: number) {
    const request = await this.joinRequestRepository.findOne({
      where: { id: requestId },
      relations: {
        team: { hackathon: { settings: true, phases: true } },
        hackathonUser: true,
      },
    });
    if (!request) {
      throw new NotFoundException('Join request not found');
    }
    const team = request.team;

    try {
      await this.dataSource.transaction(async (manager) => {
        // Lock the team row: accepts, removals and leaves on this team now
        // run one at a time, so two accepts can't both take the last spot.
        await manager.findOne(Team, {
          where: { id: team.id },
          lock: { mode: 'pessimistic_write' },
        });
        await this.checkLeader(manager, team.id, userId);
        this.checkRegistrationOpen(team.hackathon);

        // Only a PENDING request can be accepted. Checking the status in the
        // UPDATE itself means a request can't be answered twice.
        const answered = await manager.update(
          TeamJoinRequest,
          { id: requestId, status: JoinRequestStatus.PENDING },
          { status: JoinRequestStatus.ACCEPTED },
        );
        if (!answered.affected) {
          throw new BadRequestException('This request was already answered');
        }

        const memberCount = await manager.count(TeamMember, {
          where: { team: { id: team.id } },
        });
        if (memberCount >= team.hackathon.settings.maxTeamMembers) {
          throw new ConflictException('This team is full');
        }

        // If the user joined another team in the meantime, the unique
        // hackathon_user_id constraint rejects this insert.
        await manager.save(
          manager.create(TeamMember, {
            team,
            hackathonUser: request.hackathonUser,
          }),
        );

        // The user is in a team now, so their other requests are closed.
        await manager.update(
          TeamJoinRequest,
          {
            hackathonUser: { id: request.hackathonUser.id },
            status: JoinRequestStatus.PENDING,
          },
          { status: JoinRequestStatus.REJECTED },
        );
      });
    } catch (error) {
      throw this.toConflict(error);
    }

    return this.findOne(team.id);
  }

  async rejectRequest(requestId: number, userId: number) {
    const request = await this.joinRequestRepository.findOne({
      where: { id: requestId },
      relations: { team: true },
    });
    if (!request) {
      throw new NotFoundException('Join request not found');
    }
    await this.checkLeader(this.dataSource.manager, request.team.id, userId);

    const answered = await this.joinRequestRepository.update(
      { id: requestId, status: JoinRequestStatus.PENDING },
      { status: JoinRequestStatus.REJECTED },
    );
    if (!answered.affected) {
      throw new BadRequestException('This request was already answered');
    }

    return { message: 'Join request rejected' };
  }

  async removeMember(teamId: number, memberUserId: number, userId: number) {
    const team = await this.findTeam(teamId);
    if (team.hackathon.endAt <= new Date()) {
      throw new BadRequestException('This hackathon has ended');
    }
    if (memberUserId === userId) {
      throw new BadRequestException(
        'Leave the team instead of removing yourself',
      );
    }

    await this.dataSource.transaction(async (manager) => {
      await manager.findOne(Team, {
        where: { id: teamId },
        lock: { mode: 'pessimistic_write' },
      });
      await this.checkLeader(manager, teamId, userId);

      const member = await manager.findOne(TeamMember, {
        where: {
          team: { id: teamId },
          hackathonUser: { user: { id: memberUserId } },
        },
      });
      if (!member) {
        throw new NotFoundException('This user is not a member of this team');
      }
      await manager.remove(member);
    });

    return this.findOne(teamId);
  }

  async leave(teamId: number, userId: number) {
    const membership = await this.teamMemberRepository.findOne({
      where: {
        team: { id: teamId },
        hackathonUser: { user: { id: userId } },
      },
      relations: { team: { hackathon: true } },
    });
    if (!membership) {
      throw new NotFoundException('You are not a member of this team');
    }
    if (membership.team.hackathon.endAt <= new Date()) {
      throw new BadRequestException('This hackathon has ended');
    }

    // The leader is the oldest member, so when the leader leaves the next
    // oldest member becomes leader. A team left with no members is deleted.
    await this.dataSource.transaction(async (manager) => {
      await manager.findOne(Team, {
        where: { id: teamId },
        lock: { mode: 'pessimistic_write' },
      });
      await manager.remove(membership);

      const remaining = await manager.count(TeamMember, {
        where: { team: { id: teamId } },
      });
      if (remaining === 0) {
        await manager.delete(Team, teamId);
      }
    });

    return { message: 'You left the team' };
  }

  async findOne(teamId: number) {
    const team = await this.teamRepository.findOne({
      where: { id: teamId },
      relations: {
        hackathon: { settings: true },
        members: { hackathonUser: { user: true } },
      },
      order: { members: { joinedAt: 'ASC', id: 'ASC' } },
    });
    if (!team) {
      throw new NotFoundException('Team not found');
    }

    // Only pick the fields the frontend needs, so user data such as
    // passwordHash is never sent back.
    return {
      id: team.id,
      name: team.name,
      description: team.description,
      createdAt: team.createdAt,
      hackathonId: team.hackathon.id,
      minMembers: team.hackathon.settings.minTeamMembers,
      maxMembers: team.hackathon.settings.maxTeamMembers,
      // Members are sorted oldest first, so the first one is the leader.
      leaderId: team.members[0]?.hackathonUser.user.id ?? null,
      members: team.members.map((member) => ({
        userId: member.hackathonUser.user.id,
        username: member.hackathonUser.user.username,
        fullName: member.hackathonUser.user.fullName,
        joinedAt: member.joinedAt,
      })),
    };
  }

  async findMine(hackathonId: number, userId: number) {
    await this.findHackathon(hackathonId);

    const membership = await this.teamMemberRepository.findOne({
      where: {
        hackathonUser: {
          user: { id: userId },
          hackathon: { id: hackathonId },
        },
      },
      relations: { team: true },
    });
    if (!membership) {
      return { team: null };
    }

    return { team: await this.findOne(membership.team.id) };
  }

  // Used by other features (team chat) to check access to a team.
  async isMember(teamId: number, userId: number) {
    const count = await this.teamMemberRepository.count({
      where: {
        team: { id: teamId },
        hackathonUser: { user: { id: userId } },
      },
    });
    return count > 0;
  }

  // The leader is the member who joined first.
  private async checkLeader(
    manager: EntityManager,
    teamId: number,
    userId: number,
  ) {
    const leader = await manager.findOne(TeamMember, {
      where: { team: { id: teamId } },
      relations: { hackathonUser: { user: true } },
      order: { joinedAt: 'ASC', id: 'ASC' },
    });
    if (leader?.hackathonUser.user.id !== userId) {
      throw new ForbiddenException('Only the team leader can do this');
    }
  }

  private async checkLeaderOrOrganizer(team: Team, userId: number) {
    const organizer = await this.hackathonUserRepository.findOne({
      where: {
        user: { id: userId },
        hackathon: { id: team.hackathon.id },
        hackRoleName: HackRoleName.ORGANIZER,
      },
    });
    if (organizer) {
      return;
    }

    try {
      await this.checkLeader(this.dataSource.manager, team.id, userId);
    } catch {
      throw new ForbiddenException(
        'Only the team leader or an organizer can do this',
      );
    }
  }

  // Joining is only allowed before the hackathon ends and, when the
  // hackathon has a REGISTRATION phase, during that phase.
  private checkRegistrationOpen(hackathon: Hackathon) {
    const now = new Date();
    if (hackathon.endAt <= now) {
      throw new BadRequestException('This hackathon has ended');
    }

    const registration = hackathon.phases?.find(
      (phase) => phase.phaseName === HackathonPhaseName.REGISTRATION,
    );
    if (
      registration &&
      (now < registration.startAt || now >= registration.endAt)
    ) {
      throw new BadRequestException('Team registration is not open');
    }
  }

  private async findParticipantWithoutTeam(
    hackathonId: number,
    userId: number,
    forbiddenMessage: string,
  ) {
    const registration = await this.hackathonUserRepository.findOne({
      where: {
        user: { id: userId },
        hackathon: { id: hackathonId },
        hackRoleName: HackRoleName.PARTICIPANT,
      },
    });
    if (!registration) {
      throw new ForbiddenException(forbiddenMessage);
    }

    const membership = await this.teamMemberRepository.findOne({
      where: { hackathonUser: { id: registration.id } },
    });
    if (membership) {
      throw new ConflictException(
        'You are already in a team for this hackathon',
      );
    }

    return registration;
  }

  // Two requests at the same moment can both pass the checks; the unique
  // constraints then reject the second one.
  private toConflict(error: unknown) {
    const driverError = (
      error as QueryFailedError & {
        driverError?: { code?: string; constraint?: string };
      }
    ).driverError;
    if (error instanceof QueryFailedError && driverError?.code === '23505') {
      switch (driverError.constraint) {
        case 'UQ_teams_hackathon_name':
          return new ConflictException('A team with this name already exists');
        case 'UQ_team_join_requests_pending':
          return new ConflictException(
            'You already requested to join this team',
          );
        default:
          return new ConflictException(
            'This user is already in a team for this hackathon',
          );
      }
    }
    return error;
  }

  private async findTeam(teamId: number) {
    const team = await this.teamRepository.findOne({
      where: { id: teamId },
      relations: { hackathon: true },
    });
    if (!team) {
      throw new NotFoundException('Team not found');
    }
    return team;
  }

  private async findHackathon(hackathonId: number) {
    const hackathon = await this.hackathonRepository.findOne({
      where: { id: hackathonId },
    });
    if (!hackathon) {
      throw new NotFoundException('Hackathon not found');
    }
    return hackathon;
  }
}
