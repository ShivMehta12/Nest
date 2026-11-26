import {
  Controller,
  Post,
  Body,
  Get,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  SignUp,
  login,
  LoginDto,
  RegisterDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/authDto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Users } from '../users/users.entity';
import { response } from '../../utils/response';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Register a new user
   */
  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    const result = await this.authService.register(registerDto);
    return response.success(result, 'User registered successfully');
  }

  /**
   * Alias for signup (backwards compatibility)
   */
  @Public()
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async signUp(@Body() signUpDto: SignUp, @Req() req: any) {
    return await this.authService.signUp(signUpDto, req.body);
  }

  /**
   * Authenticate and login user
   */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto, @Req() req: any) {
    const result = await this.authService.login(loginDto, req.body);
    return response.success(result, 'Login successful');
  }

  /**
   * Refresh JWT access token
   */
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    const result = await this.authService.refreshToken(refreshTokenDto);
    return response.success(result, 'Tokens refreshed successfully');
  }

  /**
   * Request password reset token
   */
  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    const result = await this.authService.forgotPassword(forgotPasswordDto);
    return response.success(result, result.message);
  }

  /**
   * Reset password with reset token
   */
  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    const result = await this.authService.resetPassword(resetPasswordDto);
    return response.success(result, result.message);
  }

  /**
   * Get currently authenticated user profile
   */
  @Get('me')
  async getMe(@CurrentUser() currentUser: Users) {
    return response.success(currentUser, 'Profile retrieved successfully');
  }
}
