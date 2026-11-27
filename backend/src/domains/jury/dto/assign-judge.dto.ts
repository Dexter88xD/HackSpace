import { IsInt, Min } from 'class-validator';

export class AssignJudgeDto {
  @IsInt()
  @Min(1)
  userId!: number;
}
