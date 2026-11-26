import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ChatMessage, ChatMessageDocument } from './schemas/chat-message.schema';
import { SendMessageDto, QueryChatDto } from './dto';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(ChatMessage.name)
    private readonly chatModel: Model<ChatMessageDocument>,
  ) {}

  /**
   * Send a message (stored in MongoDB)
   */
  async sendMessage(senderId: number, dto: SendMessageDto): Promise<ChatMessage> {
    const message = new this.chatModel({
      senderId,
      receiverId: dto.receiverId,
      message: dto.message,
      messageType: dto.messageType || 'text',
      attachments: dto.attachments || [],
    });
    return message.save();
  }

  /**
   * Get conversation between two users (paginated)
   */
  async getConversation(userId: number, otherUserId: number, query: QueryChatDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 50));
    const skip = (page - 1) * limit;

    const filter = {
      isDeleted: false,
      $or: [
        { senderId: userId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: userId },
      ],
    };

    const [messages, total] = await Promise.all([
      this.chatModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.chatModel.countDocuments(filter).exec(),
    ]);

    return {
      messages: messages.reverse(), // Oldest first for chat display
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get list of recent conversations (unique contacts)
   */
  async getRecentConversations(userId: number) {
    // MongoDB aggregation pipeline — something SQL can't do this cleanly
    return this.chatModel.aggregate([
      {
        $match: {
          isDeleted: false,
          $or: [{ senderId: userId }, { receiverId: userId }],
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$senderId', userId] },
              '$receiverId',
              '$senderId',
            ],
          },
          lastMessage: { $first: '$message' },
          lastMessageAt: { $first: '$createdAt' },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$receiverId', userId] }, { $eq: ['$isRead', false] }] },
                1,
                0,
              ],
            },
          },
        },
      },
      { $sort: { lastMessageAt: -1 } },
      { $limit: 50 },
    ]);
  }

  /**
   * Mark messages as read
   */
  async markConversationAsRead(userId: number, senderId: number) {
    const result = await this.chatModel.updateMany(
      { senderId, receiverId: userId, isRead: false },
      { isRead: true, readAt: new Date() },
    );
    return { modifiedCount: result.modifiedCount };
  }

  /**
   * Soft delete a message
   */
  async deleteMessage(messageId: string) {
    await this.chatModel.findByIdAndUpdate(messageId, { isDeleted: true });
    return { message: 'Message deleted' };
  }
}
