import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { UsersService } from './users.service';
import {
  CreateUserDto,
  UpdateUserDto,
  ChangePasswordDto,
  QueryUserDto,
} from './dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/role.enum';
import { Users } from './users.entity';
import { response } from '../../utils/response';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Create a new user (admin or authorized user)
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser() currentUser: Users,
  ) {
    const created = await this.usersService.create(createUserDto, currentUser?.id);
    return response.success(created, 'User created successfully');
  }

  /**
   * List all users with pagination, filtering, searching
   */
  @Get()
  async findAll(@Query() query: QueryUserDto) {
    const result = await this.usersService.findAll(query);
    return response.success(result, 'Users retrieved successfully');
  }

  /**
   * Get logged-in user profile
   */
  @Get('me')
  async getProfile(@CurrentUser() currentUser: Users) {
    const user = await this.usersService.findById(currentUser.id);
    return response.success(user, 'Profile retrieved successfully');
  }

  /**
   * Update logged-in user profile
   */
  @Patch('me')
  async updateProfile(
    @CurrentUser('id') userId: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const updated = await this.usersService.update(userId, updateUserDto);
    return response.success(updated, 'Profile updated successfully');
  }

  /**
   * Change logged-in user password
   */
  @Patch('change-password')
  async changePassword(
    @CurrentUser('id') userId: number,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    const result = await this.usersService.changePassword(userId, changePasswordDto);
    return response.success(result, 'Password changed successfully');
  }

  /**
   * Get single user by ID
   */
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const user = await this.usersService.findById(id);
    return response.success(user, 'User retrieved successfully');
  }

  /**
   * Update user by ID
   */
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const updated = await this.usersService.update(id, updateUserDto);
    return response.success(updated, 'User updated successfully');
  }

  /**
   * Delete user by ID (soft delete)
   */
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const result = await this.usersService.remove(id);
    return response.success(result, 'User deleted successfully');
  }

  /**
   * Restore soft-deleted user by ID
   */
  @Patch(':id/restore')
  async restore(@Param('id', ParseIntPipe) id: number) {
    const restored = await this.usersService.restore(id);
    return response.success(restored, 'User restored successfully');
  }

  // --- Backwards Compatibility Routes ---

  @Get('all')
  async findAllUsersLegacy(@Query() query: any, @Req() req: any) {
    const data = await this.usersService.getAllUsers(query);
    return response.success(data, 'Users retrieved successfully');
  }

  @Post('add-user')
  async addUserLegacy(@Body() body: any, @Req() req: any) {
    const currentUserId = req?.identity?.id || req?.user?.id;
    return await this.usersService.addUser(body, currentUserId);
  }
}
