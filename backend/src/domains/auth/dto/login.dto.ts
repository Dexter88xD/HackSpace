import { IsNotEmpty, IsString } from 'class-validator';

// DTO used to validate incoming request data. The decorators define the rules,
// while the ValidationPipe instance in main.ts applies them and transforms the data.

export class LoginDto {
  @IsNotEmpty()
  @IsString()
  identifier!: string;

  @IsNotEmpty()
  @IsString()
  password!: string;
}
