import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Notification,
  NotificationDocument,
} from './schemas/notification.schema';
import { CreateNotificationDto, QueryNotificationDto } from './dto';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
  ) {}

  /**
   * Create a new notification (stored in MongoDB)
   */
  async create(dto: CreateNotificationDto): Promise<Notification> {
    const notification = new this.notificationModel(dto);
    return notification.save();
  }

  /**
   * Get all notifications for a user with pagination and filters
   */
  async findAllForUser(userId: number, query: QueryNotificationDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter: any = { userId };

    if (query.isRead !== undefined) {
      filter.isRead = query.isRead;
    }
    if (query.type) {
      filter.type = query.type;
    }

    const [notifications, total] = await Promise.all([
      this.notificationModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.notificationModel.countDocuments(filter).exec(),
    ]);

    return {
      notifications,
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
   * Get count of unread notifications
   */
  async getUnreadCount(userId: number): Promise<number> {
    return this.notificationModel.countDocuments({ userId, isRead: false }).exec();
  }

  /**
   * Mark a single notification as read
   */
  async markAsRead(notificationId: string): Promise<Notification | null> {
    return this.notificationModel
      .findByIdAndUpdate(notificationId, { isRead: true }, { new: true })
      .exec();
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: number) {
    const result = await this.notificationModel.updateMany(
      { userId, isRead: false },
      { isRead: true },
    );
    return { modifiedCount: result.modifiedCount };
  }

  /**
   * Delete a notification
   */
  async remove(notificationId: string) {
    await this.notificationModel.findByIdAndDelete(notificationId).exec();
    return { message: 'Notification deleted' };
  }
}
