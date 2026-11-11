import { IsDateString, IsEnum } from 'class-validator';
import { HackathonPhaseName } from '../entities/hackathon-phase.entity';

export class HackathonPhaseDto {
  @IsEnum(HackathonPhaseName)
  phaseName!: HackathonPhaseName;

  @IsDateString({ strict: true })
  startAt!: string;

  @IsDateString({ strict: true })
  endAt!: string;
}
