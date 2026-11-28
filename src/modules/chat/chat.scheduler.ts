import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';

@Injectable()
export class ChatScheduler {
  private readonly logger = new Logger(ChatScheduler.name);
  private isProcessing = false;

  constructor(
    private readonly chatService: ChatService,
    @Inject(forwardRef(() => ChatGateway))
    private readonly chatGateway: ChatGateway,
  ) {}

  /**
   * Runs every 10 seconds to check if any scheduled messages are due for delivery
   */
  @Cron('*/10 * * * * *')
  async handleScheduledMessages() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const dueMessages = await this.chatService.getDueScheduledMessages();

      if (dueMessages.length > 0) {
        this.logger.log(`Processing ${dueMessages.length} due scheduled messages...`);

        for (const msg of dueMessages) {
          // Mark as sent in MongoDB
          const updated = await this.chatService.markScheduledAsSent(msg._id.toString());
          if (!updated) continue;

          // Dispatch in real time through WebSocket Gateway
          if (updated.groupId) {
            // Group message
            this.chatGateway.server
              .to(`group_${updated.groupId}`)
              .emit('newGroupMessage', updated);
          } else if (updated.receiverId) {
            // 1-on-1 message
            this.chatGateway.server
              .to(`user_${updated.receiverId}`)
              .emit('newMessage', updated);
            this.chatGateway.server
              .to(`user_${updated.senderId}`)
              .emit('messageSent', updated);
          }

          this.logger.log(`Scheduled message #${msg._id} delivered to target room.`);
        }
      }
    } catch (err: any) {
      this.logger.error(`Error processing scheduled messages: ${err.message}`);
    } finally {
      this.isProcessing = false;
    }
  }
}
