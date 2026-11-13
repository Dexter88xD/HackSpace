import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @IsOptional()
  @IsUUID()
  avatarFileId?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  organizationName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  major?: string;
}
