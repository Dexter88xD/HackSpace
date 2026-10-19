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
  organizationName!: string;

  @IsISO8601({ strict: true })
  startAt!: string;

  @IsISO8601({ strict: true })
  endAt!: string;
}
