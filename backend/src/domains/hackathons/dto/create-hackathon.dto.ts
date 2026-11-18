import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { HackathonPhaseDto } from './hackathon-phase.dto';
import { HackathonSettingsDto } from './hackathon-settings.dto';

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
  @ArrayMaxSize(5)
  @ArrayMinSize(5)
  @ValidateNested({ each: true })
  @Type(() => HackathonPhaseDto)
  phases!: HackathonPhaseDto[];

  @IsDateString({ strict: true })
  startAt!: string;

  @IsDateString({ strict: true })
  endAt!: string;

  @ValidateIf((_, value: unknown) => value !== undefined)
  @IsObject()
  @ValidateNested()
  @Type(() => HackathonSettingsDto)
  settings?: HackathonSettingsDto;
}
