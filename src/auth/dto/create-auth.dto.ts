// without decrorator any variable not exist or nest ignore them and give error
import { IsEmail, IsString, MinLength } from 'class-validator';

export class CreateAuthDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}
