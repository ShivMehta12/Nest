// src/auth/auth.service.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt'; // Import JwtService
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../modules/users/users.service'; // Assuming logic here or users service

@Injectable()
export class AuthService { // Renamed service to AuthService
  constructor(
    private usersService: UsersService, // Inject UsersService to find user
    private jwtService: JwtService, // Inject JwtService
  ) { }

  login = async (body_data: any) => {
    const { email, password } = body_data;
    // 1. Validate the user credentials (similar to your original logic)
    const user = await this.usersService.getUserByEmail(email);

    if (!user) {
      throw new BadRequestException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new BadRequestException('Invalid credentials');
    }

    // 2. If valid, create the JWT payload
    // Only include necessary, non-sensitive data in the token payload
    const payload = {
      email: user.email,
      sub: user.id, // 'sub' is a standard JWT claim for subject (user ID)
    };

    // 3. Generate and return the token
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  register(createAuthDto: any) {
    // Add registration logic here (e.g., save user to database)
    return { message: 'Registration successful', user: createAuthDto };
  }
}
