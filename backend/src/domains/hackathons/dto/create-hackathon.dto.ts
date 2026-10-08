import {
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

export class CreateHackathonDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: 'Title must contain non-whitespace characters' })
  title!: string;

  @IsString()
  @IsOptional()
  description!: string | null;

  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, {
    message: 'Organization name must contain non-whitespace characters',
  })
  organization_name!: string;

  @IsISO8601({ strict: true })
  start_at!: string;

  @IsISO8601({ strict: true })
  end_at!: string;
}
