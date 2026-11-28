import { IsString, IsNotEmpty, IsOptional, IsNumber, IsArray, IsDateString } from 'class-validator';

export class SendMessageDto {
  @IsNumber()
  receiverId: number;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsOptional()
  messageType?: string;

  @IsArray()
  @IsOptional()
  attachments?: Record<string, any>[];

  @IsDateString()
  @IsOptional()
  scheduledFor?: string;
}
