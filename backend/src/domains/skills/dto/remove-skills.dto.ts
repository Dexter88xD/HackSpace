import { ArrayNotEmpty, IsArray, IsInt, Max, Min } from 'class-validator';

export class RemoveSkillsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Max(Number.MAX_SAFE_INTEGER, { each: true })
  skillIds!: number[];
}
