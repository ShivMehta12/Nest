import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Inject, forwardRef } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ChatService } from './chat.service';
import {
  SendMessageDto,
  SendGroupMessageDto,
  CreateGroupDto,
  EditMessageDto,
  DeleteMessageDto,
  ReactionDto,
  ScheduleMessageDto,
} from './dto';

export interface AuthenticatedSocket extends Socket {
  data: {
    user: {
      id: number;
      sub?: number;
      email: string;
      role?: string;
    };
  };
}

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  // In-memory registry: userId -> Set of active socket IDs
  private readonly onlineUsers = new Map<number, Set<string>>();

  constructor(
    @Inject(forwardRef(() => ChatService))
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('Chat WebSocket Gateway initialized on namespace: /chat');
  }

  // ═════════════════════════════════════════════════════════════════
  // Connection Lifecycle & Room Auto-Joining
  // ═════════════════════════════════════════════════════════════════

  /**
   * Called when a client connects. Validates JWT and auto-joins personal room: "user_{userId}"
   */
  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = this.extractToken(client);
      if (!token) {
        this.logger.warn(`Rejected connection without token: ${client.id}`);
        client.emit('error', { message: 'Authentication token required' });
        client.disconnect(true);
        return;
      }

      const secret = this.configService.get<string>(
        'JWT_SECRET',
        'super_secret_nest_jwt_key_2026_change_in_production',
      );

      const payload = await this.jwtService.verifyAsync(token, { secret });
      const userId = Number(payload.sub || payload.id);

      client.data.user = {
        id: userId,
        sub: userId,
        email: payload.email,
        role: payload.role,
      };

      // ── How room connection works ──
      // 1. Client joins their personal room: "user_{userId}"
      // Any message sent to user_1 will reach ALL connected tabs/devices of User 1
      const userRoom = `user_${userId}`;
      await client.join(userRoom);
      console.log("reaching here")
      // 2. Auto-join all group rooms this user is a member of
      const userGroups = await this.chatService.getUserGroups(userId);
      for (const group of userGroups) {
        await client.join(`group_${(group as any)._id}`);
      }

      // 3. Track online presence
      if (!this.onlineUsers.has(userId)) {
        this.onlineUsers.set(userId, new Set());
      }
      this.onlineUsers.get(userId)?.add(client.id);

      this.logger.log(`User #${userId} connected to room [${userRoom}] (Socket: ${client.id})`);

      // Broadcast online status to everyone
      this.server.emit('userStatus', { userId, status: 'online' });

      // Send connection acknowledgement to the client
      client.emit('connected', {
        message: 'Successfully connected to Chat Gateway',
        userId,
        socketId: client.id,
        rooms: Array.from(client.rooms),
      });
    } catch (err: any) {
      this.logger.warn(`Auth failed for socket ${client.id}: ${err.message}`);
      client.emit('error', { message: 'Invalid or expired token' });
      client.disconnect(true);
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    const userId = client.data?.user?.id;
    if (userId) {
      const userSockets = this.onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(client.id);
        if (userSockets.size === 0) {
          this.onlineUsers.delete(userId);
          this.server.emit('userStatus', { userId, status: 'offline' });
        }
      }
      this.logger.log(`User #${userId} disconnected (Socket: ${client.id})`);
    }
  }

  // ═════════════════════════════════════════════════════════════════
  // 1. Direct Messaging (1-on-1)
  // ═════════════════════════════════════════════════════════════════

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: SendMessageDto,
  ) {
    const senderId = client.data.user.id;
    const receiverId = Number(payload.receiverId);

    const savedMessage = await this.chatService.sendMessage(senderId, payload);

    if (savedMessage.status === 'scheduled') {
      return {
        status: 'scheduled',
        message: 'Message scheduled for delivery',
        messageId: (savedMessage as any)._id,
        scheduledFor: savedMessage.scheduledFor,
      };
    }

    // Deliver to recipient's room
    this.server.to(`user_${receiverId}`).emit('newMessage', savedMessage);
    // Confirm delivery to sender's room
    this.server.to(`user_${senderId}`).emit('messageSent', savedMessage);

    return { status: 'delivered', messageId: (savedMessage as any)._id };
  }

  // ═════════════════════════════════════════════════════════════════
  // 2. Group Messaging
  // ═════════════════════════════════════════════════════════════════

  /**
   * Event: 'createGroup'
   * Creates a group in MongoDB, joins the creator's socket to 'group_{groupId}', and notifies invited members
   */
  @SubscribeMessage('createGroup')
  async handleCreateGroup(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: CreateGroupDto,
  ) {
    const creatorId = client.data.user.id;
    const group = await this.chatService.createGroup(creatorId, payload);
    const groupRoom = `group_${group._id}`;

    // Creator joins the room
    await client.join(groupRoom);

    // Notify all invited members in their personal rooms so their UI updates
    for (const member of group.members) {
      this.server.to(`user_${member.userId}`).emit('groupCreated', group);
    }

    return { status: 'success', group };
  }

  /**
   * Event: 'joinGroup'
   * Explicitly joins socket to a group room
   */
  @SubscribeMessage('joinGroup')
  async handleJoinGroup(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { groupId: string },
  ) {
    const userId = client.data.user.id;
    const group = await this.chatService.getGroupById(payload.groupId);

    const isMember = group.members.some((m) => m.userId === userId);
    if (!isMember) {
      return { status: 'error', message: 'You are not a member of this group' };
    }

    const groupRoom = `group_${group._id}`;
    await client.join(groupRoom);

    return { status: 'joined', room: groupRoom };
  }

  /**
   * Event: 'leaveGroup'
   * Socket leaves a group room
   */
  @SubscribeMessage('leaveGroup')
  async handleLeaveGroup(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { groupId: string },
  ) {
    const groupRoom = `group_${payload.groupId}`;
    await client.leave(groupRoom);
    return { status: 'left', room: groupRoom };
  }

  /**
   * Event: 'sendGroupMessage'
   * Persists message to MongoDB and broadcasts it to everyone in 'group_{groupId}'
   */
  @SubscribeMessage('sendGroupMessage')
  async handleSendGroupMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: SendGroupMessageDto,
  ) {
    const senderId = client.data.user.id;
    const { message, group } = await this.chatService.sendGroupMessage(senderId, payload);
    const groupRoom = `group_${group._id}`;

    // Broadcast to everyone in the group room in ONE single operation
    this.server.to(groupRoom).emit('newGroupMessage', message);

    return { status: 'delivered', messageId: (message as any)._id };
  }

  // ═════════════════════════════════════════════════════════════════
  // 3. Message Deletion ("Delete for Me" vs "Delete for Everyone")
  // ═════════════════════════════════════════════════════════════════

  /**
   * Event: 'deleteMessage'
   * mode: 'me' ➡️ only hidden for caller
   * mode: 'everyone' ➡️ message content replaced and real-time 'messageDeleted' emitted
   */
  @SubscribeMessage('deleteMessage')
  async handleDeleteMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: DeleteMessageDto,
  ) {
    const userId = client.data.user.id;
    const { message, mode } = await this.chatService.deleteMessage(userId, payload);

    if (mode === 'everyone') {
      const deletePayload = {
        messageId: (message as any)._id,
        isDeletedForEveryone: true,
        message: 'This message was deleted',
      };

      if (message.groupId) {
        // Broadcast delete to the entire group room
        this.server.to(`group_${message.groupId}`).emit('messageDeleted', deletePayload);
      } else if (message.receiverId) {
        // Broadcast delete to recipient and sender
        this.server.to(`user_${message.receiverId}`).emit('messageDeleted', deletePayload);
        this.server.to(`user_${message.senderId}`).emit('messageDeleted', deletePayload);
      }
    }

    return { status: 'deleted', mode, messageId: (message as any)._id };
  }

  // ═════════════════════════════════════════════════════════════════
  // 4. Message Editing
  // ═════════════════════════════════════════════════════════════════

  /**
   * Event: 'editMessage'
   * Edits message and broadcasts 'messageEdited' event to target room
   */
  @SubscribeMessage('editMessage')
  async handleEditMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: EditMessageDto,
  ) {
    const userId = client.data.user.id;
    const updated = await this.chatService.editMessage(userId, payload);

    const editPayload = {
      messageId: (updated as any)._id,
      newMessage: updated.message,
      isEdited: true,
      editHistory: updated.editHistory,
    };

    if (updated.groupId) {
      this.server.to(`group_${updated.groupId}`).emit('messageEdited', editPayload);
    } else if (updated.receiverId) {
      this.server.to(`user_${updated.receiverId}`).emit('messageEdited', editPayload);
      this.server.to(`user_${updated.senderId}`).emit('messageEdited', editPayload);
    }

    return { status: 'edited', messageId: (updated as any)._id };
  }

  // ═════════════════════════════════════════════════════════════════
  // 5. Emoji Reactions
  // ═════════════════════════════════════════════════════════════════

  /**
   * Event: 'addReaction'
   * Adds or toggles emoji reaction (❤️, 👍, 😂) and broadcasts 'messageReaction'
   */
  @SubscribeMessage('addReaction')
  async handleAddReaction(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: ReactionDto,
  ) {
    const userId = client.data.user.id;
    const updated = await this.chatService.addReaction(userId, payload);

    const reactionPayload = {
      messageId: (updated as any)._id,
      reactions: updated.reactions,
    };

    if (updated.groupId) {
      this.server.to(`group_${updated.groupId}`).emit('messageReaction', reactionPayload);
    } else if (updated.receiverId) {
      this.server.to(`user_${updated.receiverId}`).emit('messageReaction', reactionPayload);
      this.server.to(`user_${updated.senderId}`).emit('messageReaction', reactionPayload);
    }

    return { status: 'success', reactions: updated.reactions };
  }

  // ═════════════════════════════════════════════════════════════════
  // 6. Scheduled Messages
  // ═════════════════════════════════════════════════════════════════

  /**
   * Event: 'scheduleMessage'
   * Saves message with 'scheduled' status. Delivered automatically by ChatScheduler cron.
   */
  @SubscribeMessage('scheduleMessage')
  async handleScheduleMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: ScheduleMessageDto,
  ) {
    const senderId = client.data.user.id;
    const scheduled = await this.chatService.scheduleMessage(senderId, payload);

    return {
      status: 'scheduled',
      messageId: (scheduled as any)._id,
      scheduledFor: scheduled.scheduledFor,
    };
  }

  // ═════════════════════════════════════════════════════════════════
  // 7. Typing Indicators & Read Receipts
  // ═════════════════════════════════════════════════════════════════

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { receiverId?: number; groupId?: string; isTyping: boolean },
  ) {
    const senderId = client.data.user.id;

    if (payload.groupId) {
      // Group typing
      client.to(`group_${payload.groupId}`).emit('userTyping', {
        senderId,
        groupId: payload.groupId,
        isTyping: !!payload.isTyping,
      });
    } else if (payload.receiverId) {
      // Direct typing
      this.server.to(`user_${payload.receiverId}`).emit('userTyping', {
        senderId,
        isTyping: !!payload.isTyping,
      });
    }
  }

  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { senderId: number },
  ) {
    const currentUserId = client.data.user.id;
    const senderId = Number(payload.senderId);

    const result = await this.chatService.markConversationAsRead(currentUserId, senderId);

    this.server.to(`user_${senderId}`).emit('messagesRead', {
      readBy: currentUserId,
      modifiedCount: result.modifiedCount,
    });

    return { status: 'success', modifiedCount: result.modifiedCount };
  }

  @SubscribeMessage('getOnlineUsers')
  handleGetOnlineUsers() {
    return Array.from(this.onlineUsers.keys());
  }

  private extractToken(client: Socket): string | null {
    const authHeader = client.handshake.auth?.token;
    if (authHeader) {
      return authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;
    }

    const header = client.handshake.headers?.authorization;
    if (header) {
      return header.startsWith('Bearer ') ? header.split(' ')[1] : header;
    }

    const queryToken = client.handshake.query?.token;
    if (typeof queryToken === 'string') {
      return queryToken;
    }

    return null;
  }
}
