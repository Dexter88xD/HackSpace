import { IsInt, Max, Min, ValidateIf } from 'class-validator';

const MAX_INT32 = 2_147_483_647;

// Omitted fields are allowed; explicit null values are rejected.
export class HackathonSettingsDto {
  @ValidateIf((_, value: unknown) => value !== undefined)
  @IsInt()
  @Min(1)
  @Max(MAX_INT32)
  minTeamMembers?: number;

  @ValidateIf((_, value: unknown) => value !== undefined)
  @IsInt()
  @Min(1)
  @Max(MAX_INT32)
  maxTeamMembers?: number;

  @ValidateIf((_, value: unknown) => value !== undefined)
  @IsInt()
  @Min(1)
  @Max(MAX_INT32)
  filesLimit?: number;

  @ValidateIf((_, value: unknown) => value !== undefined)
  @IsInt()
  @Min(1)
  @Max(MAX_INT32)
  fileMaxSize?: number;
}
