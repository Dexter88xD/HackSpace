import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { HackathonPhaseName } from '../entities/hackathon-phase.entity';

export class HackathonPhaseDto {
  @IsEnum(HackathonPhaseName)
  phaseName!: HackathonPhaseName;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsDateString({ strict: true })
  startAt!: string;

  @IsDateString({ strict: true })
  endAt!: string;
}
