import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateScoringCriterionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;
}
