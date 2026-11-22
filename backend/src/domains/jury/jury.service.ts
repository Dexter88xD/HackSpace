import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { HackathonsService } from '../hackathons/hackathons.service';
import { Hackathon } from '../hackathons/entities/hackathon.entity';
import {
  HackathonUser,
  HackRoleName,
} from '../hackathons/entities/hackathon-user.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class JuryService {
  constructor(
    private readonly hackathonsService: HackathonsService,

    @InjectRepository(Hackathon)
    private readonly hackathonRepository: Repository<Hackathon>,

    @InjectRepository(HackathonUser)
    private readonly hackathonUserRepository: Repository<HackathonUser>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async assignJudge(
    hackathonId: number,
    targetUserId: number,
    requesterId: number,
  ) {
    const hackathon = await this.hackathonRepository.findOneBy({
      id: hackathonId,
    });

    if (!hackathon) {
      throw new NotFoundException('Hackathon not found');
    }

    const canManage = await this.hackathonsService.canEditHackathon(
      hackathonId,
      requesterId,
    );

    if (!canManage) {
      throw new ForbiddenException(
        'You are not authorised to manage this hackathon',
      );
    }

    const targetUser = await this.userRepository.findOneBy({
      id: targetUserId,
    });

    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    const existingMembership = await this.hackathonUserRepository.findOne({
      where: {
        user: { id: targetUserId },
        hackathon: { id: hackathonId },
      },
    });

    if (existingMembership) {
      throw new ConflictException(
        existingMembership.hackRoleName === HackRoleName.JURY
          ? 'User is already assigned as a judge'
          : 'User already has a different role in this hackathon',
      );
    }

    const judge = this.hackathonUserRepository.create({
      user: targetUser,
      hackathon,
      hackRoleName: HackRoleName.JURY,
    });

    try {
      const savedJudge = await this.hackathonUserRepository.save(judge);

      return {
        id: savedJudge.id,
        userId: targetUserId,
        hackathonId,
        role: savedJudge.hackRoleName,
      };
    } catch (error) {
      if (error instanceof QueryFailedError) {
        const driverError = error.driverError as {
          code?: string;
          constraint?: string;
        };

        if (
          driverError.code === '23505' &&
          driverError.constraint === 'UQ_hackathon_users_user_hackathon'
        ) {
          throw new ConflictException('User already belongs to this hackathon');
        }
      }

      throw error;
    }
  }
}
