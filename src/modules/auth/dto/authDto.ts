import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional } from 'class-validator';
export class login {
    @IsEmail() @IsNotEmpty()
    email: string;

    @IsString() @IsNotEmpty() @MinLength(6)
    password: string;
}

export class SignUp {
    @IsEmail() @IsNotEmpty()
    email: string;

    @IsNotEmpty() @IsString() @MinLength(6)
    password: string;

    @IsString() @IsNotEmpty() @MinLength(6)
    confirmPassword: string;

    @IsString() @IsNotEmpty()
    firstName: string;

    @IsString() @IsOptional()
    lastName: string;
}

export class ForgetPassword {
    @IsEmail() @IsNotEmpty()
    email: string;
}

export class ResetPassword {
    @IsString() @IsNotEmpty() @MinLength(6)
    password: string;

    @IsString() @IsNotEmpty() @MinLength(6)
    new_password: string;

    @IsString() @IsNotEmpty() @MinLength(6)
    confirmPassword: string;
}