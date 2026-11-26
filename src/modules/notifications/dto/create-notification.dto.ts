import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber, IsObject, IsArray } from 'class-validator';
import { NotificationType } from '../schemas/notification.schema';

export class CreateNotificationDto {
  @IsNumber()
  userId: number;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsEnum(NotificationType)
  @IsOptional()
  type?: NotificationType;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @IsArray()
  @IsOptional()
  tags?: string[];
}
