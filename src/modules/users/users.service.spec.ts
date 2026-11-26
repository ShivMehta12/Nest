import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { Users } from './users.entity';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { UserRole } from '../../common/enums/role.enum';
import * as bcrypt from 'bcryptjs';

describe('UsersService', () => {
  let service: UsersService;
  let mockRepository: any;

  beforeEach(async () => {
    mockRepository = {
      findOne: jest.fn(),
      create: jest.fn((dto) => dto),
      save: jest.fn((user) => Promise.resolve({ id: 1, ...user })),
      createQueryBuilder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(Users),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw ConflictException if email exists', async () => {
      mockRepository.findOne.mockResolvedValueOnce({ id: 1, email: 'test@example.com' });

      await expect(
        service.create({
          firstName: 'John',
          email: 'test@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create and save a new user with hashed password', async () => {
      mockRepository.findOne.mockResolvedValueOnce(null);

      const result = await service.create({
        firstName: 'John',
        email: 'john@example.com',
        password: 'password123',
      });

      expect(mockRepository.create).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result.email).toBe('john@example.com');
      expect((result as any).password).toBeUndefined();
    });
  });

  describe('findById', () => {
    it('should return user if found', async () => {
      const mockUser = { id: 1, firstName: 'John', email: 'john@example.com' };
      mockRepository.findOne.mockResolvedValueOnce(mockUser);

      const result = await service.findById(1);
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException if not found', async () => {
      mockRepository.findOne.mockResolvedValueOnce(null);

      await expect(service.findById(999)).rejects.toThrow(NotFoundException);
    });
  });
});
