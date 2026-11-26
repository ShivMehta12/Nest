import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Users } from './users.entity';
import {
  CreateUserDto,
  UpdateUserDto,
  ChangePasswordDto,
  QueryUserDto,
} from './dto';
import { response } from '../../utils/response';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Users)
    private readonly usersRepository: Repository<Users>,
  ) {}

  /**
   * Create a new user
   */
  async create(createUserDto: CreateUserDto, addedById?: number): Promise<Omit<Users, 'password'>> {
    const existing = await this.usersRepository.findOne({
      where: { email: createUserDto.email.toLowerCase().trim() },
    });

    if (existing) {
      throw new ConflictException('A user with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = this.usersRepository.create({
      ...createUserDto,
      email: createUserDto.email.toLowerCase().trim(),
      password: hashedPassword,
      addedBy: addedById ? ({ id: addedById } as Users) : null,
    });

    const savedUser = await this.usersRepository.save(user);
    const { password, ...result } = savedUser;
    return result as Omit<Users, 'password'>;
  }

  /**
   * Find all users with pagination, search, and filters
   */
  async findAll(query: QueryUserDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const queryBuilder = this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.addedBy', 'addedBy')
      .where('user.isDeleted = :isDeleted', { isDeleted: false });

    if (query.search) {
      const searchTerm = `%${query.search.toLowerCase()}%`;
      queryBuilder.andWhere(
        '(LOWER(user.firstName) LIKE :search OR LOWER(user.lastName) LIKE :search OR LOWER(user.email) LIKE :search)',
        { search: searchTerm },
      );
    }

    if (query.role) {
      queryBuilder.andWhere('user.role = :role', { role: query.role });
    }

    if (query.isActive !== undefined) {
      queryBuilder.andWhere('user.isActive = :isActive', { isActive: query.isActive });
    }

    const validSortColumns = ['id', 'firstName', 'lastName', 'email', 'createdAt', 'role'];
    const sortBy = validSortColumns.includes(query.sortBy) ? `user.${query.sortBy}` : 'user.createdAt';
    const order = (query.order || 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    queryBuilder.orderBy(sortBy, order);
    queryBuilder.skip(skip).take(limit);

    const [users, total] = await queryBuilder.getManyAndCount();

    return {
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Find a single user by ID
   */
  async findById(id: number): Promise<Users> {
    const user = await this.usersRepository.findOne({
      where: { id, isDeleted: false },
      relations: ['addedBy'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID #${id} not found`);
    }

    return user;
  }

  /**
   * Find user by email (optionally including password for auth check)
   */
  async findByEmail(email: string, selectPassword = false): Promise<Users | null> {
    const normalizedEmail = email.toLowerCase().trim();

    if (selectPassword) {
      return await this.usersRepository
        .createQueryBuilder('user')
        .addSelect('user.password')
        .where('LOWER(user.email) = :email', { email: normalizedEmail })
        .andWhere('user.isDeleted = :isDeleted', { isDeleted: false })
        .getOne();
    }

    return await this.usersRepository.findOne({
      where: { email: normalizedEmail, isDeleted: false },
    });
  }

  /**
   * Update user details
   */
  async update(id: number, updateUserDto: UpdateUserDto): Promise<Users> {
    const user = await this.findById(id);

    if (updateUserDto.email && updateUserDto.email.toLowerCase() !== user.email.toLowerCase()) {
      const emailExists = await this.usersRepository.findOne({
        where: { email: updateUserDto.email.toLowerCase().trim() },
      });
      if (emailExists && emailExists.id !== id) {
        throw new ConflictException('Email already in use by another account');
      }
      user.email = updateUserDto.email.toLowerCase().trim();
    }

    if (updateUserDto.password) {
      user.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    if (updateUserDto.firstName !== undefined) user.firstName = updateUserDto.firstName;
    if (updateUserDto.lastName !== undefined) user.lastName = updateUserDto.lastName;
    if (updateUserDto.phoneNumber !== undefined) user.phoneNumber = updateUserDto.phoneNumber;
    if (updateUserDto.avatar !== undefined) user.avatar = updateUserDto.avatar;
    if (updateUserDto.role !== undefined) user.role = updateUserDto.role;
    if (updateUserDto.isActive !== undefined) user.isActive = updateUserDto.isActive;

    return await this.usersRepository.save(user);
  }

  /**
   * Change user password
   */
  async changePassword(userId: number, changePasswordDto: ChangePasswordDto): Promise<{ message: string }> {
    const user = await this.findByEmail((await this.findById(userId)).email, true);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isMatch = await bcrypt.compare(changePasswordDto.currentPassword, user.password);
    if (!isMatch) {
      throw new BadRequestException('Current password does not match');
    }

    user.password = await bcrypt.hash(changePasswordDto.newPassword, 10);
    await this.usersRepository.save(user);

    return { message: 'Password updated successfully' };
  }

  /**
   * Soft delete a user
   */
  async remove(id: number): Promise<{ message: string }> {
    const user = await this.findById(id);
    user.isDeleted = true;
    user.isActive = false;
    user.deletedAt = new Date();
    await this.usersRepository.save(user);

    return { message: `User #${id} successfully deleted` };
  }

  /**
   * Restore a soft-deleted user
   */
  async restore(id: number): Promise<Users> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID #${id} not found`);
    }

    user.isDeleted = false;
    user.isActive = true;
    user.deletedAt = null;

    return await this.usersRepository.save(user);
  }

  // --- Backwards Compatibility Helpers ---

  async getAllUsers(query: any) {
    const res = await this.findAll(query);
    return res.users;
  }

  async getUser(id: any) {
    return await this.findById(Number(id));
  }

  async getUserByEmail(email: string) {
    return await this.findByEmail(email);
  }

  async addUser(dto: any, addedById: number) {
    try {
      const created = await this.create(dto, addedById);
      return response.success(created, 'User added successfully');
    } catch (error: any) {
      return response.failed(error.message || 'Something went wrong', null);
    }
  }
}
