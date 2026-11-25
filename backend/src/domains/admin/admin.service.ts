import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, IsNull, Repository } from 'typeorm';

import { User } from '../users/entities/user.entity';
import { RoleName, UserRole } from '../users/entities/user-role.entity';
import { AdminUsersQueryDto } from './dto/admin-users-query.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  async findUsers(query: AdminUsersQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [users, total] = await this.userRepository.findAndCount({
      where: { deletedAt: IsNull() },
      relations: { role: true },
      order: { id: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: users.map((user) => this.toResponse(user)),
      total,
      page,
      limit,
    };
  }

  async updateRole(userId: number, roleName: RoleName) {
    return this.dataSource.transaction(async (manager) => {
      const user = await this.lockAndFindUser(manager, userId);
      if (user.role.roleName === roleName) return this.toResponse(user);

      const newRole = await manager.findOne(UserRole, {
        where: { roleName },
      });
      if (!newRole) throw new NotFoundException('Role not found');

      if (user.role.roleName === RoleName.ROLE_ADMIN)
        await this.ensureNotLastAdmin(manager, 'demote');

      user.role = newRole;
      await manager.save(user);
      return this.toResponse(user);
    });
  }

  async deleteUser(userId: number): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const user = await this.lockAndFindUser(manager, userId);

      if (user.role.roleName === RoleName.ROLE_ADMIN)
        await this.ensureNotLastAdmin(manager, 'delete');

      await manager.update(User, user.id, { deletedAt: new Date() });
    });
  }

  // Locks the ROLE_ADMIN row first so concurrent role changes and deletions
  // run one after the other; the admin count is then always up to date.
  private async lockAndFindUser(manager: EntityManager, userId: number) {
    await manager.findOne(UserRole, {
      where: { roleName: RoleName.ROLE_ADMIN },
      lock: { mode: 'pessimistic_write' },
    });
    const user = await manager.findOne(User, {
      where: { id: userId, deletedAt: IsNull() },
      relations: { role: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  private async ensureNotLastAdmin(
    manager: EntityManager,
    action: 'demote' | 'delete',
  ) {
    const adminCount = await manager.count(User, {
      where: {
        role: { roleName: RoleName.ROLE_ADMIN },
        deletedAt: IsNull(),
      },
    });
    if (adminCount <= 1)
      throw new ConflictException(`Cannot ${action} the last administrator`);
  }

  private toResponse(user: User) {
    return {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      role: user.role.roleName,
      createdAt: user.createdAt,
    };
  }
}
