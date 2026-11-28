import { IsString, IsNotEmpty, IsOptional, IsNumber, IsArray, IsDateString } from 'class-validator';

export class SendGroupMessageDto {
  @IsString()
  @IsNotEmpty()
  groupId: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsOptional()
  messageType?: string;

  @IsArray()
  @IsOptional()
  attachments?: Record<string, any>[];
}

export class CreateGroupDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  avatar?: string;

  @IsArray()
  @IsNotEmpty()
  memberIds: number[];
}

export class EditMessageDto {
  @IsString()
  @IsNotEmpty()
  messageId: string;

  @IsString()
  @IsNotEmpty()
  newMessage: string;
}

export class DeleteMessageDto {
  @IsString()
  @IsNotEmpty()
  messageId: string;

  @IsString()
  @IsNotEmpty()
  mode: 'me' | 'everyone';
}

export class ReactionDto {
  @IsString()
  @IsNotEmpty()
  messageId: string;

  @IsString()
  @IsNotEmpty()
  emoji: string;
}

export class ScheduleMessageDto {
  @IsNumber()
  @IsOptional()
  receiverId?: number;

  @IsString()
  @IsOptional()
  groupId?: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsDateString()
  @IsNotEmpty()
  scheduledFor: string;
}
