import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import {
  SignUp,
  login,
  LoginDto,
  RegisterDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/authDto';
import { response } from '../../utils/response';
import { Users } from '../users/users.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Register a new user and return JWT tokens
   */
  async register(registerDto: RegisterDto) {
    if (
      registerDto.confirmPassword &&
      registerDto.password !== registerDto.confirmPassword
    ) {
      throw new BadRequestException('Passwords do not match');
    }

    const createdUser = await this.usersService.create({
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      email: registerDto.email,
      password: registerDto.password,
      role: registerDto.role,
      phoneNumber: registerDto.phoneNumber,
    });

    const tokens = await this.generateTokens(createdUser as Users);

    return {
      user: createdUser,
      ...tokens,
    };
  }

  /**
   * Authenticate user with email and password
   */
  async login(loginDto: LoginDto, _req?: any) {
    const user = await this.usersService.findByEmail(loginDto.email, true);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account has been deactivated. Please contact support.');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.generateTokens(user);

    const { password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      ...tokens,
    };
  }

  /**
   * Refresh access token using a valid refresh token
   */
  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshTokenDto.refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET') ||
                this.configService.get<string>('JWT_SECRET', 'super_secret_nest_jwt_key_2026_change_in_production'),
      });

      const user = await this.usersService.findById(payload.sub || payload.id);
      if (!user || !user.isActive) {
        throw new UnauthorizedException('Invalid user or account deactivated');
      }

      const tokens = await this.generateTokens(user);
      return tokens;
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  /**
   * Request password reset token
   */
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(forgotPasswordDto.email);
    if (!user) {
      // Return success to avoid email enumeration
      return { message: 'If an account exists with this email, a reset link has been sent.' };
    }

    const resetToken = await this.jwtService.signAsync(
      { sub: user.id, email: user.email, purpose: 'pwd_reset' },
      {
        secret: this.configService.get<string>('JWT_SECRET', 'super_secret_nest_jwt_key_2026_change_in_production'),
        expiresIn: '15m',
      },
    );

    return {
      message: 'Password reset token generated successfully',
      resetToken, // In production this would be sent via email
    };
  }

  /**
   * Reset password with reset token
   */
  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    if (
      resetPasswordDto.confirmPassword &&
      resetPasswordDto.newPassword !== resetPasswordDto.confirmPassword
    ) {
      throw new BadRequestException('Passwords do not match');
    }

    try {
      const payload = await this.jwtService.verifyAsync(resetPasswordDto.token, {
        secret: this.configService.get<string>('JWT_SECRET', 'super_secret_nest_jwt_key_2026_change_in_production'),
      });

      if (payload.purpose !== 'pwd_reset') {
        throw new BadRequestException('Invalid token purpose');
      }

      const user = await this.usersService.findById(payload.sub);
      await this.usersService.update(user.id, { password: resetPasswordDto.newPassword });

      return { message: 'Password has been reset successfully' };
    } catch (err: any) {
      if (err instanceof BadRequestException) throw err;
      throw new BadRequestException('Invalid or expired password reset token');
    }
  }

  /**
   * Generate JWT Access & Refresh Tokens
   */
  private async generateTokens(user: Users) {
    const payload = {
      sub: user.id,
      id: user.id,
      email: user.email,
      role: user.role,
    };

    const jwtSecret = this.configService.get<string>(
      'JWT_SECRET',
      'super_secret_nest_jwt_key_2026_change_in_production',
    );
    const expiresIn = this.configService.get('JWT_EXPIRES_IN', '1d') as any;

    const refreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') || jwtSecret;

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: jwtSecret,
        expiresIn: (expiresIn as any),
      }),
      this.jwtService.signAsync(payload, {
        secret: refreshSecret,
        expiresIn: ('7d' as any),
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn,
    };
  }

  // --- Backwards Compatibility Helpers ---

  async signUp(signUpDto: SignUp, _req: any) {
    try {
      const data = await this.register(signUpDto);
      return response.success(data, 'User registered successfully');
    } catch (error: any) {
      return response.failed(error.message || 'Failed to sign up', null);
    }
  }
}
