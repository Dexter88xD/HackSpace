import { IsEnum } from 'class-validator';
import { RoleName } from '../../users/entities/user-role.entity';

export class UpdateUserRoleDto {
  @IsEnum(RoleName)
  role!: RoleName;
}
