import {
  IsInt,
  IsPositive,
  IsString,
  MinLength,
  MaxLength,
} from 'class-validator';

export class MessageDto {
  @IsInt()
  @IsPositive()
  chatRoomId!: number;

  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  content!: string;
}
