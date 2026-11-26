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
import { SendMessageDto, QueryChatDto } from './dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { response } from '../../utils/response';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  /**
   * Send a message to another user
   */
  @Post('send')
  @HttpCode(HttpStatus.CREATED)
  async sendMessage(
    @CurrentUser('id') senderId: number,
    @Body() dto: SendMessageDto,
  ) {
    const result = await this.chatService.sendMessage(senderId, dto);
    return response.success(result, 'Message sent');
  }

  /**
   * Get conversation with a specific user
   */
  @Get('conversation/:userId')
  async getConversation(
    @CurrentUser('id') currentUserId: number,
    @Param('userId', ParseIntPipe) otherUserId: number,
    @Query() query: QueryChatDto,
  ) {
    const result = await this.chatService.getConversation(currentUserId, otherUserId, query);
    return response.success(result, 'Conversation retrieved');
  }

  /**
   * Get list of recent conversations
   */
  @Get('conversations')
  async getRecentConversations(@CurrentUser('id') userId: number) {
    const result = await this.chatService.getRecentConversations(userId);
    return response.success(result, 'Recent conversations retrieved');
  }

  /**
   * Mark all messages from a sender as read
   */
  @Patch('read/:senderId')
  async markAsRead(
    @CurrentUser('id') userId: number,
    @Param('senderId', ParseIntPipe) senderId: number,
  ) {
    const result = await this.chatService.markConversationAsRead(userId, senderId);
    return response.success(result, 'Messages marked as read');
  }

  /**
   * Delete a message
   */
  @Delete(':id')
  async deleteMessage(@Param('id') id: string) {
    const result = await this.chatService.deleteMessage(id);
    return response.success(result, 'Message deleted');
  }
}
