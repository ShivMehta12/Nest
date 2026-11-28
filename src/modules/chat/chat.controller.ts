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
  ParseIntPipe,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import {
  SendMessageDto,
  SendGroupMessageDto,
  CreateGroupDto,
  QueryChatDto,
  EditMessageDto,
  DeleteMessageDto,
  ReactionDto,
  ScheduleMessageDto,
} from './dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { response } from '../../utils/response';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // ───── 1-on-1 Messages ─────

  @Post('send')
  @HttpCode(HttpStatus.CREATED)
  async sendMessage(
    @CurrentUser('id') senderId: number,
    @Body() dto: SendMessageDto,
  ) {
    const result = await this.chatService.sendMessage(senderId, dto);
    return response.success(result, result.status === 'scheduled' ? 'Message scheduled' : 'Message sent');
  }

  @Get('conversation/:userId')
  async getConversation(
    @CurrentUser('id') currentUserId: number,
    @Param('userId', ParseIntPipe) otherUserId: number,
    @Query() query: QueryChatDto,
  ) {
    const result = await this.chatService.getConversation(currentUserId, otherUserId, query);
    return response.success(result, 'Conversation retrieved');
  }

  @Get('conversations')
  async getRecentConversations(@CurrentUser('id') userId: number) {
    const result = await this.chatService.getRecentConversations(userId);
    return response.success(result, 'Recent conversations retrieved');
  }

  @Patch('read/:senderId')
  async markAsRead(
    @CurrentUser('id') userId: number,
    @Param('senderId', ParseIntPipe) senderId: number,
  ) {
    const result = await this.chatService.markConversationAsRead(userId, senderId);
    return response.success(result, 'Messages marked as read');
  }

  // ───── Group Chats ─────

  @Post('groups')
  @HttpCode(HttpStatus.CREATED)
  async createGroup(
    @CurrentUser('id') creatorId: number,
    @Body() dto: CreateGroupDto,
  ) {
    const result = await this.chatService.createGroup(creatorId, dto);
    return response.success(result, 'Group created successfully');
  }

  @Get('groups')
  async getUserGroups(@CurrentUser('id') userId: number) {
    const result = await this.chatService.getUserGroups(userId);
    return response.success(result, 'User groups retrieved');
  }

  @Get('groups/:groupId')
  async getGroupDetails(@Param('groupId') groupId: string) {
    const result = await this.chatService.getGroupById(groupId);
    return response.success(result, 'Group details retrieved');
  }

  @Post('groups/send')
  @HttpCode(HttpStatus.CREATED)
  async sendGroupMessage(
    @CurrentUser('id') senderId: number,
    @Body() dto: SendGroupMessageDto,
  ) {
    const result = await this.chatService.sendGroupMessage(senderId, dto);
    return response.success(result.message, 'Group message sent');
  }

  @Get('groups/:groupId/messages')
  async getGroupMessages(
    @CurrentUser('id') userId: number,
    @Param('groupId') groupId: string,
    @Query() query: QueryChatDto,
  ) {
    const result = await this.chatService.getGroupConversation(groupId, userId, query);
    return response.success(result, 'Group messages retrieved');
  }

  // ───── Message Actions (Delete, Edit, React, Schedule) ─────

  @Delete('messages')
  async deleteMessage(
    @CurrentUser('id') userId: number,
    @Body() dto: DeleteMessageDto,
  ) {
    const result = await this.chatService.deleteMessage(userId, dto);
    return response.success(result, `Message deleted (${result.mode})`);
  }

  @Patch('messages/edit')
  async editMessage(
    @CurrentUser('id') userId: number,
    @Body() dto: EditMessageDto,
  ) {
    const result = await this.chatService.editMessage(userId, dto);
    return response.success(result, 'Message edited successfully');
  }

  @Post('messages/react')
  async addReaction(
    @CurrentUser('id') userId: number,
    @Body() dto: ReactionDto,
  ) {
    const result = await this.chatService.addReaction(userId, dto);
    return response.success(result, 'Reaction updated');
  }

  @Post('schedule')
  @HttpCode(HttpStatus.CREATED)
  async scheduleMessage(
    @CurrentUser('id') senderId: number,
    @Body() dto: ScheduleMessageDto,
  ) {
    const result = await this.chatService.scheduleMessage(senderId, dto);
    return response.success(result, 'Message scheduled successfully');
  }
}
