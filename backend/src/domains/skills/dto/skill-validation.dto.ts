import { Transform, Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min, ValidateBy } from 'class-validator';

export const cleanSkillName = (name: string): string =>
  name.trim().replace(/\s+/g, ' ');

export const NormalizeSkillName = () =>
  Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? cleanSkillName(value) : value,
  );

export const IsSkillName = () =>
  ValidateBy({
    name: 'isSkillName',
    validator: {
      validate: (value: unknown) => {
        if (typeof value !== 'string') return false;
        const name = cleanSkillName(value);
        return (
          name.length > 0 &&
          [...name].length <= 50 &&
          [...name.toLowerCase()].length <= 50
        );
      },
      defaultMessage: () =>
        'name must contain 1 to 50 characters, including after lowercasing',
    },
  });

export class SkillIdParamsDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(Number.MAX_SAFE_INTEGER)
  id!: number;
}

export class ProfileIdParamsDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(Number.MAX_SAFE_INTEGER)
  profileId!: number;
}

export class SkillNameQueryDto {
  @IsOptional()
  @NormalizeSkillName()
  @IsSkillName()
  name?: string;
}

export class SkillNameLookupQueryDto {
  @NormalizeSkillName()
  @IsSkillName()
  name!: string;
}
