import { IsString,  IsEmail, IsNotEmpty, MinLength, isNotEmpty } from 'class-validator';
export class CreateUserDto {
    @IsString()
    firstName: string;

    @IsString()
    lastName: string;

    @IsNotEmpty()
    @IsEmail()
    email: string;

    @IsNotEmpty()
    @MinLength(6)
    password: string;
  }
  