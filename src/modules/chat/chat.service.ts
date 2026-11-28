import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ChatMessage, ChatMessageDocument } from './schemas/chat-message.schema';
import { ChatGroup, ChatGroupDocument } from './schemas/chat-group.schema';
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

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(ChatMessage.name)
    private readonly chatModel: Model<ChatMessageDocument>,
    @InjectModel(ChatGroup.name)
    private readonly groupModel: Model<ChatGroupDocument>,
  ) {}

  // ═════════════════════════════════════════════════════════════════
  // 1. Direct 1-on-1 Messages
  // ═════════════════════════════════════════════════════════════════

  /**
   * Send a 1-on-1 message (persisted in MongoDB)
   */
  async sendMessage(senderId: number, dto: SendMessageDto): Promise<ChatMessageDocument> {
    const isScheduled = !!dto.scheduledFor;
    const scheduledDate = isScheduled ? new Date(dto.scheduledFor) : null;

    if (isScheduled && scheduledDate <= new Date()) {
      throw new BadRequestException('Scheduled date must be in the future');
    }

    const message = new this.chatModel({
      senderId,
      receiverId: dto.receiverId,
      message: dto.message,
      messageType: dto.messageType || 'text',
      attachments: dto.attachments || [],
      status: isScheduled ? 'scheduled' : 'sent',
      scheduledFor: scheduledDate,
    });

    return message.save();
  }

  /**
   * Get conversation between two users (excluding messages deleted by caller)
   */
  async getConversation(userId: number, otherUserId: number, query: QueryChatDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 50));
    const skip = (page - 1) * limit;

    const filter: any = {
      // Exclude messages deleted for this user
      deletedForUsers: { $ne: userId },
      // Exclude messages still in "scheduled" pending state (not yet sent)
      status: 'sent',
      $or: [
        { senderId: userId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: userId },
      ],
    };

    const [rawMessages, total] = await Promise.all([
      this.chatModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.chatModel.countDocuments(filter).exec(),
    ]);

    // Mask messages deleted for everyone (WhatsApp style)
    const sanitized = rawMessages.map((msg) => {
      const doc = msg.toObject();
      if (doc.isDeletedForEveryone) {
        doc.message = 'This message was deleted';
        doc.attachments = [];
      }
      return doc;
    });

    return {
      messages: sanitized.reverse(),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ═════════════════════════════════════════════════════════════════
  // 2. Group Chats
  // ═════════════════════════════════════════════════════════════════

  /**
   * Create a new Group Chat
   */
  async createGroup(creatorId: number, dto: CreateGroupDto): Promise<ChatGroupDocument> {
    const uniqueMemberIds = Array.from(new Set([creatorId, ...dto.memberIds]));

    const members = uniqueMemberIds.map((userId) => ({
      userId,
      role: userId === creatorId ? ('admin' as const) : ('member' as const),
      joinedAt: new Date(),
    }));

    const group = new this.groupModel({
      name: dto.name,
      description: dto.description || '',
      avatar: dto.avatar || '',
      createdById: creatorId,
      members,
    });

    return group.save();
  }

  /**
   * Get all groups a user belongs to
   */
  async getUserGroups(userId: number): Promise<ChatGroup[]> {
    return this.groupModel
      .find({
        isArchived: false,
        'members.userId': userId,
      })
      .sort({ updatedAt: -1 })
      .exec();
  }

  /**
   * Get group details by ID
   */
  async getGroupById(groupId: string): Promise<ChatGroupDocument> {
    if (!Types.ObjectId.isValid(groupId)) {
      throw new BadRequestException('Invalid group ID format');
    }
    const group = await this.groupModel.findById(groupId).exec();
    if (!group || group.isArchived) {
      throw new NotFoundException('Group not found');
    }
    return group;
  }

  /**
   * Send message into a Group
   */
  async sendGroupMessage(
    senderId: number,
    dto: SendGroupMessageDto,
  ): Promise<{ message: ChatMessageDocument; group: ChatGroupDocument }> {
    const group = await this.getGroupById(dto.groupId);

    // Verify sender is an active member of this group
    const isMember = group.members.some((m) => m.userId === senderId);
    if (!isMember) {
      throw new ForbiddenException('You are not a member of this group');
    }

    const message = new this.chatModel({
      senderId,
      groupId: new Types.ObjectId(dto.groupId),
      message: dto.message,
      messageType: dto.messageType || 'text',
      attachments: dto.attachments || [],
      status: 'sent',
    });

    const saved = await message.save();

    // Touch group updatedAt
    group.set('updatedAt', new Date());
    await group.save();

    return { message: saved, group };
  }

  /**
   * Get group message history
   */
  async getGroupConversation(groupId: string, userId: number, query: QueryChatDto) {
    const group = await this.getGroupById(groupId);
    const isMember = group.members.some((m) => m.userId === userId);
    if (!isMember) {
      throw new ForbiddenException('You are not a member of this group');
    }

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 50));
    const skip = (page - 1) * limit;

    const filter: any = {
      groupId: new Types.ObjectId(groupId),
      deletedForUsers: { $ne: userId },
      status: 'sent',
    };

    const [rawMessages, total] = await Promise.all([
      this.chatModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.chatModel.countDocuments(filter).exec(),
    ]);

    const sanitized = rawMessages.map((msg) => {
      const doc = msg.toObject();
      if (doc.isDeletedForEveryone) {
        doc.message = 'This message was deleted';
        doc.attachments = [];
      }
      return doc;
    });

    return {
      group,
      messages: sanitized.reverse(),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ═════════════════════════════════════════════════════════════════
  // 3. Message Deletion ("Delete for Me" vs "Delete for Everyone")
  // ═════════════════════════════════════════════════════════════════

  /**
   * Delete message either for the caller only or for everyone
   */
  async deleteMessage(
    userId: number,
    dto: DeleteMessageDto,
  ): Promise<{ message: ChatMessageDocument; mode: 'me' | 'everyone' }> {
    const message = await this.chatModel.findById(dto.messageId).exec();
    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (dto.mode === 'everyone') {
      // Only the sender can delete for everyone
      if (message.senderId !== userId) {
        throw new ForbiddenException('Only the sender can delete a message for everyone');
      }

      message.isDeletedForEveryone = true;
      message.deletedAt = new Date();
      await message.save();

      return { message, mode: 'everyone' };
    } else {
      // "Delete for Me": append userId to deletedForUsers array
      if (!message.deletedForUsers.includes(userId)) {
        message.deletedForUsers.push(userId);
        await message.save();
      }
      return { message, mode: 'me' };
    }
  }

  // ═════════════════════════════════════════════════════════════════
  // 4. Message Editing
  // ═════════════════════════════════════════════════════════════════

  /**
   * Edit a message (only allowed by original sender)
   */
  async editMessage(userId: number, dto: EditMessageDto): Promise<ChatMessageDocument> {
    const message = await this.chatModel.findById(dto.messageId).exec();
    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.senderId !== userId) {
      throw new ForbiddenException('You can only edit your own messages');
    }

    if (message.isDeletedForEveryone) {
      throw new BadRequestException('Cannot edit a deleted message');
    }

    // Save previous version in edit history
    message.editHistory.push({
      previousMessage: message.message,
      editedAt: new Date(),
    });

    message.message = dto.newMessage;
    message.isEdited = true;

    return message.save();
  }

  // ═════════════════════════════════════════════════════════════════
  // 5. Emoji Reactions (❤️, 👍, 😂, etc.)
  // ═════════════════════════════════════════════════════════════════

  /**
   * Add or toggle emoji reaction on a message
   */
  async addReaction(userId: number, dto: ReactionDto): Promise<ChatMessageDocument> {
    const message = await this.chatModel.findById(dto.messageId).exec();
    if (!message) {
      throw new NotFoundException('Message not found');
    }

    const existingIndex = message.reactions.findIndex(
      (r) => r.userId === userId && r.emoji === dto.emoji,
    );

    if (existingIndex > -1) {
      // If clicking same emoji again, toggle it off (remove reaction)
      message.reactions.splice(existingIndex, 1);
    } else {
      // If user had a different emoji, update it, or add new
      const userOtherIndex = message.reactions.findIndex((r) => r.userId === userId);
      if (userOtherIndex > -1) {
        message.reactions[userOtherIndex].emoji = dto.emoji;
        message.reactions[userOtherIndex].createdAt = new Date();
      } else {
        message.reactions.push({
          userId,
          emoji: dto.emoji,
          createdAt: new Date(),
        });
      }
    }

    return message.save();
  }

  // ═════════════════════════════════════════════════════════════════
  // 6. Scheduled Messages
  // ═════════════════════════════════════════════════════════════════

  /**
   * Schedule a message for future delivery
   */
  async scheduleMessage(senderId: number, dto: ScheduleMessageDto): Promise<ChatMessageDocument> {
    const scheduledDate = new Date(dto.scheduledFor);
    if (isNaN(scheduledDate.getTime()) || scheduledDate <= new Date()) {
      throw new BadRequestException('Scheduled date must be a valid future timestamp');
    }

    if (!dto.receiverId && !dto.groupId) {
      throw new BadRequestException('Either receiverId or groupId must be provided');
    }

    const message = new this.chatModel({
      senderId,
      receiverId: dto.receiverId || null,
      groupId: dto.groupId ? new Types.ObjectId(dto.groupId) : null,
      message: dto.message,
      status: 'scheduled',
      scheduledFor: scheduledDate,
    });

    return message.save();
  }

  /**
   * Find all scheduled messages that are now due for delivery
   */
  async getDueScheduledMessages(): Promise<ChatMessageDocument[]> {
    return this.chatModel
      .find({
        status: 'scheduled',
        scheduledFor: { $lte: new Date() },
      })
      .exec();
  }

  /**
   * Mark a scheduled message as delivered / sent
   */
  async markScheduledAsSent(messageId: string): Promise<ChatMessageDocument | null> {
    return this.chatModel
      .findByIdAndUpdate(
        messageId,
        { status: 'sent', createdAt: new Date() },
        { new: true },
      )
      .exec();
  }

  // ═════════════════════════════════════════════════════════════════
  // 7. Read Receipts & Conversations
  // ═════════════════════════════════════════════════════════════════

  async markConversationAsRead(userId: number, senderId: number) {
    const result = await this.chatModel.updateMany(
      { senderId, receiverId: userId, isRead: false },
      { isRead: true, readAt: new Date() },
    );
    return { modifiedCount: result.modifiedCount };
  }

  async getRecentConversations(userId: number) {
    return this.chatModel.aggregate([
      {
        $match: {
          deletedForUsers: { $ne: userId },
          status: 'sent',
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
          isDeletedForEveryone: { $first: '$isDeletedForEveryone' },
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
}
