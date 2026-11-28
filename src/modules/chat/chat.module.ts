import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { ChatScheduler } from './chat.scheduler';
import { ChatMessage, ChatMessageSchema } from './schemas/chat-message.schema';
import { ChatGroup, ChatGroupSchema } from './schemas/chat-group.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ChatMessage.name, schema: ChatMessageSchema },
      { name: ChatGroup.name, schema: ChatGroupSchema },
    ]),
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway, ChatScheduler],
  exports: [ChatService, ChatGateway],
})
export class ChatModule {}
