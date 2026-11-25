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
import {
  HackathonPhase,
  HackathonPhaseName,
} from '../hackathons/entities/hackathon-phase.entity';
import {
  HackathonUser,
  HackRoleName,
} from '../hackathons/entities/hackathon-user.entity';
import { Team } from './entities/team.entity';
import { TeamMember } from './entities/team-member.entity';
import { TeamJoinRequest } from './entities/team-join-request.entity';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { ChatMember } from '../chat/entities/chat-member.entity';
import { ChatGateway } from '../chat/chat.gateway';
import { ChatRoom, ChatRoomType } from '../chat/entities/chat-room.entity';
import { HackathonSettings } from '../hackathons/entities/hackathon-settings.entity';
import { TeamSubmission } from './entities/team-submission.entity';

@Injectable()
export class TeamsService {
  constructor(
    private readonly chatGateway: ChatGateway,
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

    @InjectRepository(ChatMember)
    private readonly chatMemberRepository: Repository<ChatMember>,

    @InjectRepository(ChatRoom)
    private readonly chatRoomRepository: Repository<ChatRoom>,
    private readonly dataSource: DataSource,
  ) {}

  private async lockTeamForMutation(manager: EntityManager, teamId: number) {
    // Lock the hackathon before the team to match the submission
    // workflow and prevent conflicting schedule and membership changes.
    const team = await manager.findOneBy(Team, { id: teamId });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    const hackathon = await manager.findOne(Hackathon, {
      where: { id: team.hackathonId },
      lock: { mode: 'pessimistic_read' },
    });

    if (!hackathon) {
      throw new NotFoundException('Hackathon not found');
    }

    const lockedTeam = await manager.findOne(Team, {
      where: { id: teamId },
      lock: { mode: 'pessimistic_write' },
    });

    if (!lockedTeam) {
      throw new NotFoundException('Team not found');
    }

    hackathon.phases = await manager.find(HackathonPhase, {
      where: { hackathon: { id: hackathon.id } },
    });

    lockedTeam.hackathon = hackathon;

    return lockedTeam;
  }

  private async checkMembershipChangeAllowed(
    manager: EntityManager,
    hackathon: Hackathon,
    teamId: number,
  ) {
    // Membership changes are allowed during registration and in progress,
    // provided the team has no finalised submission.
    this.checkPhaseAllowed(hackathon, [
      HackathonPhaseName.REGISTRATION,
      HackathonPhaseName.IN_PROGRESS,
    ]);

    const submission = await manager.findOneBy(TeamSubmission, {
      teamId,
      hackathonId: hackathon.id,
    });

    if (submission?.isSubmitted) {
      throw new ConflictException(
        'Unsubmit your project before changing team membership',
      );
    }
  }

  async create(hackathonId: number, dto: CreateTeamDto, userId: number) {
    const hackathon = await this.findHackathon(hackathonId);
    this.checkRegistrationOpen(hackathon);

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

    // Create the team, its first member and its chat room atomically.
    // If any operation fails, the entire transaction is rolled back.
    let team: Team;
    try {
      team = await this.dataSource.transaction(async (manager) => {
        const lockedHackathon = await manager.findOne(Hackathon, {
          where: { id: hackathonId },
          lock: { mode: 'pessimistic_read' },
        });

        if (!lockedHackathon) {
          throw new NotFoundException('Hackathon not found');
        }

        lockedHackathon.phases = await manager.find(HackathonPhase, {
          where: { hackathon: { id: hackathonId } },
        });

        this.checkRegistrationOpen(lockedHackathon);
        const savedTeam = await manager.save(
          manager.create(Team, {
            name,
            description: dto.description?.trim() || null,
            hackathon: lockedHackathon,
          }),
        );

        await manager.save(
          manager.create(TeamMember, {
            team: savedTeam,
            hackathonUser: registration,
          }),
        );

        const chatRoom = manager.create(ChatRoom, {
          title: `${savedTeam.name}`,
          chatRoomType: ChatRoomType.TEAM,
          team: savedTeam,
        });

        const savedChatRoom = await manager.save(ChatRoom, chatRoom);

        const chatMember = manager.create(ChatMember, {
          user: { id: userId },
          chatRoom: savedChatRoom,
        });

        await manager.save(ChatMember, chatMember);
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
    try {
      await this.dataSource.transaction(async (manager) => {
        const team = await this.lockTeamForMutation(manager, teamId);

        await this.checkLeaderOrOrganizer(team, userId, manager);

        this.checkPhaseAllowed(team.hackathon, [
          HackathonPhaseName.REGISTRATION,
          HackathonPhaseName.IN_PROGRESS,
        ]);

        if (dto.name !== undefined) {
          const name = dto.name.trim();

          const sameName = await manager.findOne(Team, {
            where: { hackathon: { id: team.hackathonId }, name },
          });

          if (sameName && sameName.id !== teamId) {
            throw new ConflictException('A team with this name already exists');
          }

          team.name = name;
        }

        if (dto.description !== undefined) {
          team.description = dto.description?.trim() || null;
        }

        await manager.save(Team, team);
      });
    } catch (error) {
      throw this.toConflict(error);
    }

    return this.findOne(teamId);
  }

  async remove(teamId: number, userId: number) {
    await this.dataSource.transaction(async (manager) => {
      const team = await this.lockTeamForMutation(manager, teamId);

      await this.checkLeaderOrOrganizer(team, userId, manager);
      this.checkRegistrationOpen(team.hackathon);

      // Related records are removed through cascading foreign keys.
      await manager.delete(Team, teamId);
    });

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

    const existing = await this.joinRequestRepository.findOne({
      where: { team: { id: teamId }, hackathonUser: { id: registration.id } },
    });
    if (existing) {
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

    return { id: request.id, teamId, createdAt: request.createdAt };
  }

  async findMyRequests(hackathonId: number, userId: number) {
    await this.findHackathon(hackathonId);

    const requests = await this.joinRequestRepository.find({
      where: {
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

    await this.joinRequestRepository.delete(requestId);

    return { message: 'Join request cancelled' };
  }

  async findRequests(teamId: number, userId: number) {
    await this.findTeam(teamId);
    await this.checkLeader(this.dataSource.manager, teamId, userId);

    const requests = await this.joinRequestRepository.find({
      where: { team: { id: teamId } },
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
        team: { hackathon: true },
        hackathonUser: { user: true },
      },
    });
    if (!request) {
      throw new NotFoundException('Join request not found');
    }
    const team = request.team;
    const hackathon = request.team.hackathon;

    try {
      await this.dataSource.transaction(async (manager) => {
        const lockedHackathon = await manager.findOne(Hackathon, {
          where: { id: hackathon.id },
          lock: { mode: 'pessimistic_write' },
        });
        if (!lockedHackathon) {
          throw new NotFoundException('Hackathon not found');
        }
        const hackathonSettings = await manager.findOne(HackathonSettings, {
          where: { hackathon: { id: lockedHackathon.id } },
        });
        if (!hackathonSettings) {
          throw new NotFoundException('Hackathon settings not found');
        }
        const lockedTeam = await manager.findOne(Team, {
          where: { id: team.id },
          lock: { mode: 'pessimistic_write' },
        });
        if (!lockedTeam) {
          throw new NotFoundException('Team not found');
        }

        const hackathonPhases = await manager.find(HackathonPhase, {
          where: { hackathon: { id: lockedHackathon.id } },
        });

        await this.checkLeader(manager, lockedTeam.id, userId);
        lockedHackathon.phases = hackathonPhases;
        this.checkRegistrationOpen(lockedHackathon);

        // If nothing was deleted, the request was already answered or
        // cancelled.
        const deleted = await manager.delete(TeamJoinRequest, requestId);
        if (!deleted.affected) {
          throw new BadRequestException('This request was already answered');
        }

        const memberCount = await manager.count(TeamMember, {
          where: { team: { id: team.id } },
        });
        if (memberCount >= hackathonSettings.maxTeamMembers) {
          throw new ConflictException('This team is full');
        }

        const chatRoom = await manager.findOne(ChatRoom, {
          where: { team: { id: team.id } },
        });
        if (!chatRoom) {
          throw new NotFoundException('Team chat room not found');
        }

        await manager.save(
          manager.create(TeamMember, {
            team: lockedTeam,
            hackathonUser: request.hackathonUser,
          }),
        );

        await manager.delete(TeamJoinRequest, {
          hackathonUser: { id: request.hackathonUser.id },
        });

        await manager.save(
          manager.create(ChatMember, {
            user: { id: request.hackathonUser.user.id },
            chatRoom,
          }),
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

    await this.joinRequestRepository.delete(requestId);

    return { message: 'Join request rejected' };
  }

  async removeMember(teamId: number, memberUserId: number, userId: number) {
    if (memberUserId === userId) {
      throw new BadRequestException(
        'Leave the team instead of removing yourself',
      );
    }

    const chatRoomId = await this.dataSource.transaction(async (manager) => {
      const team = await this.lockTeamForMutation(manager, teamId);

      await this.checkLeader(manager, teamId, userId);

      await this.checkMembershipChangeAllowed(manager, team.hackathon, teamId);

      const member = await manager.findOne(TeamMember, {
        where: {
          team: { id: teamId },
          hackathonUser: { user: { id: memberUserId } },
        },
      });
      if (!member) {
        throw new NotFoundException('This user is not a member of this team');
      }

      const chatRoom = await manager.findOne(ChatRoom, {
        where: { team: { id: teamId } },
      });
      if (!chatRoom) {
        throw new NotFoundException('Team chat room not found');
      }

      await manager.delete(ChatMember, {
        user: { id: memberUserId },
        chatRoom: { id: chatRoom.id },
      });
      await manager.remove(TeamMember, member);

      return chatRoom.id;
    });

    await this.chatGateway.removeUserFromRoom(memberUserId, chatRoomId);

    return this.findOne(teamId);
  }

  async leave(teamId: number, userId: number) {
    const chatRoomId = await this.dataSource.transaction(async (manager) => {
      const team = await this.lockTeamForMutation(manager, teamId);

      const membership = await manager.findOne(TeamMember, {
        where: {
          team: { id: teamId },
          hackathonUser: { user: { id: userId } },
        },
      });

      if (!membership) {
        throw new NotFoundException('You are not a member of this team');
      }

      await this.checkMembershipChangeAllowed(manager, team.hackathon, teamId);

      const memberCount = await manager.count(TeamMember, {
        where: { team: { id: teamId } },
      });

      // The last member can only leave during registration,
      // because an empty team is automatically deleted.
      if (memberCount === 1) {
        this.checkRegistrationOpen(team.hackathon);
      }

      const chatRoom = await manager.findOne(ChatRoom, {
        where: { team: { id: teamId } },
      });

      if (!chatRoom) {
        throw new NotFoundException('Team chat room not found');
      }

      await manager.delete(ChatMember, {
        user: { id: userId },
        chatRoom: { id: chatRoom.id },
      });

      await manager.remove(TeamMember, membership);

      if (memberCount === 1) {
        await manager.delete(Team, teamId);
      }

      return chatRoom.id;
    });

    await this.chatGateway.removeUserFromRoom(userId, chatRoomId);

    return { message: 'You left the team' };
  }

  async findOne(teamId: number) {
    const team = await this.teamRepository.findOne({
      where: { id: teamId },
      relations: {
        hackathon: { settings: true },
        members: { hackathonUser: { user: true } },
        chatRoom: true,
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
      leaderId:
        team.members.length > 0 ? team.members[0].hackathonUser.user.id : null,
      members: team.members.map((member) => ({
        userId: member.hackathonUser.user.id,
        username: member.hackathonUser.user.username,
        fullName: member.hackathonUser.user.fullName,
        joinedAt: member.joinedAt,
      })),
      chatRoom: {
        id: team.chatRoom.id,
      },
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
  private async findLeaderId(manager: EntityManager, teamId: number) {
    const leader = await manager.findOne(TeamMember, {
      where: { team: { id: teamId } },
      relations: { hackathonUser: { user: true } },
      order: { joinedAt: 'ASC', id: 'ASC' },
    });
    if (!leader) {
      return null;
    }
    return leader.hackathonUser.user.id;
  }

  private async checkLeader(
    manager: EntityManager,
    teamId: number,
    userId: number,
  ) {
    const leaderId = await this.findLeaderId(manager, teamId);
    if (leaderId !== userId) {
      throw new ForbiddenException('Only the team leader can do this');
    }
  }

  private async checkLeaderOrOrganizer(
    team: Team,
    userId: number,
    manager: EntityManager = this.dataSource.manager,
  ) {
    const organizer = await manager.findOne(HackathonUser, {
      where: {
        user: { id: userId },
        hackathon: { id: team.hackathonId },
        hackRoleName: HackRoleName.ORGANIZER,
      },
    });

    const leaderId = await this.findLeaderId(manager, team.id);

    if (!organizer && leaderId !== userId) {
      throw new ForbiddenException(
        'Only the team leader or an organizer can do this',
      );
    }
  }

  // Team operations are restricted to their permitted hackathon phases.
  // A phase includes its start time but excludes its end time.
  private checkPhaseAllowed(
    hackathon: Hackathon,
    allowedPhases: HackathonPhaseName[],
  ) {
    const now = new Date();

    const activePhase = hackathon.phases.find(
      (phase) => now >= phase.startAt && now < phase.endAt,
    );

    if (!activePhase || !allowedPhases.includes(activePhase.phaseName)) {
      throw new BadRequestException(
        'This operation is not allowed during the current phase',
      );
    }
  }

  private checkRegistrationOpen(hackathon: Hackathon) {
    this.checkPhaseAllowed(hackathon, [HackathonPhaseName.REGISTRATION]);
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
  // constraints in the database then reject the second one.
  private toConflict(error: unknown) {
    if (!(error instanceof QueryFailedError)) {
      return error;
    }
    if (error.message.includes('UQ_teams_hackathon_name')) {
      return new ConflictException('A team with this name already exists');
    }
    if (error.message.includes('UQ_team_join_requests_team_user')) {
      return new ConflictException('You already requested to join this team');
    }
    if (error.message.includes('UQ_team_members_hackathon_user')) {
      return new ConflictException(
        'This user is already in a team for this hackathon',
      );
    }
    return error;
  }

  private async findTeam(teamId: number) {
    const team = await this.teamRepository.findOne({
      where: { id: teamId },
      relations: { hackathon: { phases: true } },
    });
    if (!team) {
      throw new NotFoundException('Team not found');
    }
    return team;
  }

  private async findHackathon(hackathonId: number) {
    const hackathon = await this.hackathonRepository.findOne({
      where: { id: hackathonId },
      relations: { phases: true },
    });
    if (!hackathon) {
      throw new NotFoundException('Hackathon not found');
    }
    return hackathon;
  }
}
