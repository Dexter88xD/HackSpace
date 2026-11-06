import { Type, plainToInstance } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsObject,
  IsOptional,
  Max,
  Min,
  ValidateIf,
  ValidateNested,
  validateSync,
} from 'class-validator';
import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { IsSkillName, NormalizeSkillName } from './skill-validation.dto';

export class AddSkillDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(Number.MAX_SAFE_INTEGER)
  id?: number | null;

  @ValidateIf((_dto: AddSkillDto, value: unknown) => value !== undefined)
  @IsInt()
  @Min(1)
  @Max(Number.MAX_SAFE_INTEGER)
  profileId?: number;

  @ValidateIf(
    (dto: AddSkillDto, value: unknown) => dto.id == null || value !== undefined,
  )
  @NormalizeSkillName()
  @IsSkillName()
  name?: string;
}

export type AddSkillsDto = AddSkillDto[];

// Internal validation container; the HTTP request body remains a raw DTO array.
class SkillBatchInput {
  @IsArray()
  @ArrayNotEmpty()
  @IsObject({ each: true })
  @ValidateNested({ each: true })
  @Type(() => AddSkillDto)
  skills!: AddSkillsDto;
}

@Injectable()
export class ParseSkillBatchPipe implements PipeTransform<
  unknown,
  AddSkillsDto
> {
  transform(value: unknown): AddSkillsDto {
    const dto = plainToInstance(SkillBatchInput, { skills: value });
    const errors = validateSync(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
    });
    if (errors.length) throw new BadRequestException('Invalid skill batch');
    return dto.skills;
  }
}
