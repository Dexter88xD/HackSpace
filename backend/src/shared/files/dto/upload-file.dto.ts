import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, Min, ValidateIf } from 'class-validator';

export class UploadFileDto {
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsString()
  @IsNotEmpty()
  bucket?: string;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  hackathonId?: number;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  teamId?: number;
}
