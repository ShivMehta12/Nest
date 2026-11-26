import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsOptional,
  IsEnum,
  MaxLength,
} from 'class-validator';
import { UserRole } from '../../../common/enums/role.enum';

export class login {
  @IsEmail({}, { message: 'Invalid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;
}

export class LoginDto extends login {}

export class SignUp {
  @IsEmail({}, { message: 'Invalid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsNotEmpty({ message: 'Password is required' })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @IsString()
  @IsOptional()
  @MinLength(6)
  confirmPassword?: string;

  @IsString()
  @IsNotEmpty({ message: 'First name is required' })
  @MaxLength(50)
  firstName: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  lastName?: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @IsString()
  @IsOptional()
  phoneNumber?: string;
}

export class RegisterDto extends SignUp {}

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty({ message: 'Refresh token is required' })
  refreshToken: string;
}

export class ForgetPassword {
  @IsEmail({}, { message: 'Invalid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;
}

export class ForgotPasswordDto extends ForgetPassword {}

export class ResetPassword {
  @IsString()
  @IsNotEmpty({ message: 'Reset token is required' })
  token: string;

  @IsString()
  @IsNotEmpty({ message: 'New password is required' })
  @MinLength(6, { message: 'New password must be at least 6 characters long' })
  newPassword: string;

  @IsString()
  @IsOptional()
  @MinLength(6)
  confirmPassword?: string;
}

export class ResetPasswordDto extends ResetPassword {}
