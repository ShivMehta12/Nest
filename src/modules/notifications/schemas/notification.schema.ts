import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NotificationDocument = Notification & Document;

export enum NotificationType {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  SUCCESS = 'success',
  SYSTEM = 'system',
}

@Schema({ timestamps: true, collection: 'notifications' })
export class Notification {
  /**
   * The PostgreSQL User ID this notification belongs to.
   * This is how MongoDB documents reference your PostgreSQL users —
   * by storing the integer ID, not a Mongo ObjectId.
   */
  @Prop({ required: true, index: true })
  userId: number;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  message: string;

  @Prop({ type: String, enum: NotificationType, default: NotificationType.INFO })
  type: NotificationType;

  @Prop({ default: false, index: true })
  isRead: boolean;

  /**
   * Flexible metadata — MongoDB's superpower.
   * You can store ANY shape of data here without defining columns upfront.
   * e.g. { orderId: 123, productName: "Laptop", link: "/orders/123" }
   */
  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;

  @Prop({ type: [String], default: [] })
  tags: string[];
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

// Compound index: quickly find unread notifications for a user
NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
