import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleName } from '../../../database/entities/user-role.entity';
import type { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../../database/entities/user.entity';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.get<RoleName[]>(
      'roles',
      context.getHandler(),
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const user = await this.userRepository.findOne({
      where: { id: request.user.userId },
      relations: { role: true },
    });

    if (!user || !user.role) {
      throw new ForbiddenException('Forbidden');
    }

    if (requiredRoles.includes(user.role.role_name)) {
      return true;
    }

    throw new ForbiddenException('Forbidden');
  }
}
