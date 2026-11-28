import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ChatMessageDocument = ChatMessage & Document;

@Schema({ _id: false })
export class Reaction {
  @Prop({ required: true })
  userId: number;

  @Prop({ required: true })
  emoji: string;

  @Prop({ default: Date.now })
  createdAt: Date;
}

@Schema({ _id: false })
export class EditHistory {
  @Prop({ required: true })
  previousMessage: string;

  @Prop({ default: Date.now })
  editedAt: Date;
}

@Schema({ timestamps: true, collection: 'chat_messages' })
export class ChatMessage {
  @Prop({ required: true, index: true })
  senderId: number;

  /**
   * For direct 1-on-1 chats.
   * Null if this is a group message.
   */
  @Prop({ index: true, default: null })
  receiverId?: number;

  /**
   * For group chats.
   * Null if this is a direct 1-on-1 message.
   */
  @Prop({ type: Types.ObjectId, ref: 'ChatGroup', index: true, default: null })
  groupId?: Types.ObjectId;

  @Prop({ required: true })
  message: string;

  @Prop({ type: String, default: 'text' })
  messageType: string; // 'text', 'image', 'file', 'audio', 'system'

  @Prop({ type: [Object], default: [] })
  attachments: Record<string, any>[];

  // ───── Read Receipts ─────
  @Prop({ default: false })
  isRead: boolean;

  @Prop({ type: Date, default: null })
  readAt: Date | null;

  // ───── Deletion Mechanisms (WhatsApp style) ─────
  /**
   * "Delete for Me": Array of user IDs who hid this message from their view.
   * The message is still visible to everyone else.
   */
  @Prop({ type: [Number], default: [] })
  deletedForUsers: number[];

  /**
   * "Delete for Everyone": Message text is wiped/flagged globally.
   */
  @Prop({ default: false })
  isDeletedForEveryone: boolean;

  @Prop({ type: Date, default: null })
  deletedAt: Date | null;

  // ───── Message Editing ─────
  @Prop({ default: false })
  isEdited: boolean;

  @Prop({ type: [EditHistory], default: [] })
  editHistory: EditHistory[];

  // ───── Reactions (❤️, 👍, 😂, etc.) ─────
  @Prop({ type: [Reaction], default: [] })
  reactions: Reaction[];

  // ───── Scheduled Messages ─────
  @Prop({
    type: String,
    enum: ['sent', 'scheduled', 'cancelled'],
    default: 'sent',
    index: true,
  })
  status: 'sent' | 'scheduled' | 'cancelled';

  @Prop({ type: Date, default: null, index: true })
  scheduledFor: Date | null;
}

export const ChatMessageSchema = SchemaFactory.createForClass(ChatMessage);

// Fast compound indices
ChatMessageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });
ChatMessageSchema.index({ groupId: 1, createdAt: -1 });
ChatMessageSchema.index({ status: 1, scheduledFor: 1 });
