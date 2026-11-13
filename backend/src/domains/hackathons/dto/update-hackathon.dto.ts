import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateHackathonDto } from './create-hackathon.dto';
import {
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  ValidateNested,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { HackathonPhaseDto } from './hackathon-phase.dto';

export class UpdateHackathonDto extends PartialType(
  OmitType(CreateHackathonDto, ['phases'] as const),
  {
    skipNullProperties: false,
  },
) {
  @ValidateIf((_, value: unknown) => value !== undefined)
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  @ValidateNested({ each: true })
  @Type(() => HackathonPhaseDto)
  phases?: HackathonPhaseDto[];
}
