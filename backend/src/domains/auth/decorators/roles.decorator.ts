import { RoleName } from '../../../database/entities/user-role.entity';
import { SetMetadata } from '@nestjs/common';

export const Roles = (...roles: RoleName[]) => SetMetadata('roles', roles);
