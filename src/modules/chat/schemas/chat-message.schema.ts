import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ChatMessageDocument = ChatMessage & Document;

@Schema({ timestamps: true, collection: 'chat_messages' })
export class ChatMessage {
  /**
   * PostgreSQL User ID of the sender.
   * Cross-database reference: MongoDB doc points to PostgreSQL user.
   */
  @Prop({ required: true, index: true })
  senderId: number;

  /**
   * PostgreSQL User ID of the receiver.
   */
  @Prop({ required: true, index: true })
  receiverId: number;

  @Prop({ required: true })
  message: string;

  @Prop({ type: String, default: 'text' })
  messageType: string; // 'text', 'image', 'file', 'system'

  /**
   * Flexible attachments array — MongoDB handles arrays of objects natively.
   * No need for a separate "attachments" table like in PostgreSQL.
   * e.g. [{ url: "https://...", name: "photo.jpg", size: 1024 }]
   */
  @Prop({ type: [Object], default: [] })
  attachments: Record<string, any>[];

  @Prop({ default: false })
  isRead: boolean;

  @Prop({ type: Date, default: null })
  readAt: Date | null;

  @Prop({ default: false })
  isDeleted: boolean;
}

export const ChatMessageSchema = SchemaFactory.createForClass(ChatMessage);

// Index for fast conversation lookups between two users
ChatMessageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });
