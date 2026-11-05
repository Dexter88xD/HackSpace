import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateTeamDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @Matches(/\S/, { message: 'Name must contain non-whitespace characters' })
  name!: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string | null;
}
