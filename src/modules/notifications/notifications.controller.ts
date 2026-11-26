import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto, QueryNotificationDto } from './dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { response } from '../../utils/response';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * Create a notification (e.g., triggered by system events)
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateNotificationDto) {
    const result = await this.notificationsService.create(dto);
    return response.success(result, 'Notification created');
  }

  /**
   * Get all notifications for the current user
   */
  @Get()
  async findAll(
    @CurrentUser('id') userId: number,
    @Query() query: QueryNotificationDto,
  ) {
    const result = await this.notificationsService.findAllForUser(userId, query);
    return response.success(result, 'Notifications retrieved');
  }

  /**
   * Get unread count for the current user
   */
  @Get('unread-count')
  async getUnreadCount(@CurrentUser('id') userId: number) {
    const count = await this.notificationsService.getUnreadCount(userId);
    return response.success({ count }, 'Unread count retrieved');
  }

  /**
   * Mark a single notification as read
   */
  @Patch(':id/read')
  async markAsRead(@Param('id') id: string) {
    const result = await this.notificationsService.markAsRead(id);
    return response.success(result, 'Notification marked as read');
  }

  /**
   * Mark all notifications as read for the current user
   */
  @Patch('read-all')
  async markAllAsRead(@CurrentUser('id') userId: number) {
    const result = await this.notificationsService.markAllAsRead(userId);
    return response.success(result, 'All notifications marked as read');
  }

  /**
   * Delete a notification
   */
  @Delete(':id')
  async remove(@Param('id') id: string) {
    const result = await this.notificationsService.remove(id);
    return response.success(result, 'Notification deleted');
  }
}
