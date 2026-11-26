import { IsOptional, IsBoolean, IsEnum, IsInt, Min, IsIn } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { NotificationType } from '../schemas/notification.schema';

export class QueryNotificationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isRead?: boolean;

  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;
}
