import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Hackathon } from '../../database/entities/hackathon.entity';
import {
  HackathonUser,
  HackRoleName,
} from '../../database/entities/hackathon-user.entity';
import { Team } from '../../database/entities/team.entity';
import { TeamMember } from '../../database/entities/team-member.entity';
import { CreateTeamDto } from './dto/create-team.dto';

@Injectable()
export class TeamsService {
  constructor(
    @InjectRepository(Team)
    private readonly teamRepository: Repository<Team>,

    @InjectRepository(TeamMember)
    private readonly teamMemberRepository: Repository<TeamMember>,

    @InjectRepository(Hackathon)
    private readonly hackathonRepository: Repository<Hackathon>,

    @InjectRepository(HackathonUser)
    private readonly hackathonUserRepository: Repository<HackathonUser>,

    private readonly dataSource: DataSource,
  ) {}

  async create(hackathonId: number, dto: CreateTeamDto, userId: number) {
    const hackathon = await this.findHackathon(hackathonId);
    if (hackathon.end_at <= new Date()) {
      throw new BadRequestException('This hackathon has ended');
    }

    const registration = await this.hackathonUserRepository.findOne({
      where: {
        user: { id: userId },
        hackathon: { id: hackathonId },
        hack_role_name: HackRoleName.PARTICIPANT,
      },
    });
    if (!registration) {
      throw new ForbiddenException(
        'Only registered participants can create a team',
      );
    }

    const membership = await this.teamMemberRepository.findOne({
      where: { hackathon_user: { id: registration.id } },
    });
    if (membership) {
      throw new ConflictException(
        'You are already in a team for this hackathon',
      );
    }

    const name = dto.name.trim();
    const sameName = await this.teamRepository.findOne({
      where: { hackathon: { id: hackathonId }, name },
    });
    if (sameName) {
      throw new ConflictException('A team with this name already exists');
    }

    // The team and its first member are saved together: if one insert fails,
    // neither row is kept.
    const team = await this.dataSource.transaction(async (manager) => {
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
          hackathon_user: registration,
        }),
      );
      return savedTeam;
    });

    return this.findOne(team.id);
  }

  async findOne(teamId: number) {
    const team = await this.teamRepository.findOne({
      where: { id: teamId },
      relations: {
        hackathon: { settings: true },
        members: { hackathon_user: { user: true } },
      },
      order: { members: { joined_at: 'ASC' } },
    });
    if (!team) {
      throw new NotFoundException('Team not found');
    }

    // Only pick the fields the frontend needs, so user data such as
    // password_hash is never sent back.
    return {
      id: team.id,
      name: team.name,
      description: team.description,
      createdAt: team.created_at,
      hackathonId: team.hackathon.id,
      minMembers: team.hackathon.settings.min_team_members,
      maxMembers: team.hackathon.settings.max_team_members,
      members: team.members.map((member) => ({
        userId: member.hackathon_user.user.id,
        username: member.hackathon_user.user.username,
        fullName: member.hackathon_user.user.full_name,
        joinedAt: member.joined_at,
      })),
    };
  }

  async findMine(hackathonId: number, userId: number) {
    await this.findHackathon(hackathonId);

    const membership = await this.teamMemberRepository.findOne({
      where: {
        hackathon_user: {
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
