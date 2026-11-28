import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ChatGroupDocument = ChatGroup & Document;

@Schema({ _id: false })
export class GroupMember {
  @Prop({ required: true })
  userId: number; // PostgreSQL User ID

  @Prop({ type: String, enum: ['admin', 'member'], default: 'member' })
  role: 'admin' | 'member';

  @Prop({ default: Date.now })
  joinedAt: Date;
}

@Schema({ timestamps: true, collection: 'chat_groups' })
export class ChatGroup {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ default: '' })
  description: string;

  @Prop({ default: '' })
  avatar: string;

  @Prop({ required: true, index: true })
  createdById: number;

  @Prop({ type: [GroupMember], default: [] })
  members: GroupMember[];

  @Prop({ default: false })
  isArchived: boolean;
}

export const ChatGroupSchema = SchemaFactory.createForClass(ChatGroup);
ChatGroupSchema.index({ 'members.userId': 1 });
