import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

describe('AuthService', () => {
  let authService: AuthService;
  let mockUsersService: any;
  let mockJwtService: any;
  let mockConfigService: any;

  beforeEach(async () => {
    mockUsersService = {
      findByEmail: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
    };

    mockJwtService = {
      signAsync: jest.fn().mockResolvedValue('test.jwt.token'),
      verifyAsync: jest.fn(),
    };

    mockConfigService = {
      get: jest.fn((key: string, defaultValue?: any) => defaultValue || 'test-value'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  describe('register', () => {
    it('should throw BadRequestException if passwords mismatch', async () => {
      await expect(
        authService.register({
          email: 'test@example.com',
          password: 'password123',
          confirmPassword: 'differentPassword',
          firstName: 'John',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create user and return tokens', async () => {
      const mockCreatedUser = { id: 1, email: 'test@example.com', firstName: 'John' };
      mockUsersService.create.mockResolvedValueOnce(mockCreatedUser);

      const result = await authService.register({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
      });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user).toEqual(mockCreatedUser);
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedException if user not found', async () => {
      mockUsersService.findByEmail.mockResolvedValueOnce(null);

      await expect(
        authService.login({ email: 'unknown@example.com', password: 'password123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password incorrect', async () => {
      const hashedPassword = await bcrypt.hash('correctPassword', 10);
      mockUsersService.findByEmail.mockResolvedValueOnce({
        id: 1,
        email: 'user@example.com',
        password: hashedPassword,
        isActive: true,
      });

      await expect(
        authService.login({ email: 'user@example.com', password: 'wrongPassword' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return tokens on valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('correctPassword', 10);
      mockUsersService.findByEmail.mockResolvedValueOnce({
        id: 1,
        email: 'user@example.com',
        password: hashedPassword,
        isActive: true,
      });

      const result = await authService.login({
        email: 'user@example.com',
        password: 'correctPassword',
      });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe('user@example.com');
    });
  });
});
