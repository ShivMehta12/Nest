import {Controller} from '@nestjs/common';
import {AuthService} from './auth.service';
import {SignUp, login, ResetPassword, ForgetPassword} from './dto/authDto';
import {Post, Body, Req} from '@nestjs/common';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signUp(@Body() signUpDto: SignUp, @Req() req) {
    return await this.authService.signUp(signUpDto, req.body);
  }
}