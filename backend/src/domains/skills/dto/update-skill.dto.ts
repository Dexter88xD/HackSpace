import { IsSkillName, NormalizeSkillName } from './skill-validation.dto';

export class UpdateSkillDto {
  @NormalizeSkillName()
  @IsSkillName()
  name!: string;
}
