import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';

import { AdminService } from './admin.service';
import { AdminUsersQueryDto } from './dto/admin-users-query.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleName } from '../users/entities/user-role.entity';

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  @Roles(RoleName.ROLE_ADMIN)
  findUsers(@Query() query: AdminUsersQueryDto) {
    return this.adminService.findUsers(query);
  }

  @Patch(':id/role')
  @Roles(RoleName.ROLE_ADMIN)
  updateRole(
    @Param('id', ParseIntPipe) userId: number,
    @Body() dto: UpdateUserRoleDto,
  ) {
    return this.adminService.updateRole(userId, dto.role);
  }

  @Delete(':id')
  @Roles(RoleName.ROLE_ADMIN)
  @HttpCode(204)
  deleteUser(@Param('id', ParseIntPipe) userId: number): Promise<void> {
    return this.adminService.deleteUser(userId);
  }
}
