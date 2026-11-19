import { IsInt, Max, Min, ValidateIf } from 'class-validator';

// Omitted fields are allowed; explicit null values are rejected.
export class HackathonSettingsDto {
  @ValidateIf((_, value: unknown) => value !== undefined)
  @IsInt()
  @Min(1)
  minTeamMembers?: number;

  @ValidateIf((_, value: unknown) => value !== undefined)
  @IsInt()
  @Min(1)
  maxTeamMembers?: number;

  @ValidateIf((_, value: unknown) => value !== undefined)
  @IsInt()
  @Min(1)
  filesLimit?: number;

  @ValidateIf((_, value: unknown) => value !== undefined)
  @IsInt()
  @Min(1)
  @Max(2147483647)
  fileMaxSize?: number;
}
