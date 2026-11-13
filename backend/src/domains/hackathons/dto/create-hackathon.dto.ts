import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { HackathonPhaseDto } from './hackathon-phase.dto';

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

  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(5)
  @ArrayMinSize(5)
  @ValidateNested({ each: true })
  @Type(() => HackathonPhaseDto)
  phases!: HackathonPhaseDto[];

  @IsDateString({ strict: true })
  startAt!: string;

  @IsDateString({ strict: true })
  endAt!: string;
}
