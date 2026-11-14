import { Type } from 'class-transformer';
import { IsEnum, IsInt, Min, ValidateIf } from 'class-validator';
import { FileBucket } from '../file-bucket';

export class UploadFileDto {
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsEnum(FileBucket)
  bucket?: FileBucket;

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
