import {
  ArrayMinSize,
  IsArray,
  IsInt,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CriterionScoreDto {
  @IsInt()
  @Min(1)
  criterionId!: number;

  @IsInt()
  @Min(0)
  @Max(10)
  score!: number;
}

export class UpsertTeamScoresDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CriterionScoreDto)
  scores!: CriterionScoreDto[];
}
