import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WebhookEvent } from '../schemas/webhook-event.schema';

const DUPLICATE_KEY_ERROR_CODE = 11000;

@Injectable()
export class WebhookEventsRepository {
  constructor(
    @InjectModel(WebhookEvent.name)
    private webhookEventModel: Model<WebhookEvent>,
  ) {}

  /**
   * Attempts to acquire a lock for processing a webhook event.
   * Uses MongoDB unique constraint to prevent race conditions.
   *
   * @returns true if lock acquired (event not processed before)
   * @returns false if event already exists (duplicate)
   */
  async tryAcquire(eventId: string, eventType: string): Promise<boolean> {
    try {
      await this.webhookEventModel.create({
        eventId,
        eventType,
        processedAt: new Date(),
      });
      return true;
    } catch (error) {
      if (this.isDuplicateKeyError(error)) {
        return false;
      }
      throw error;
    }
  }

  private isDuplicateKeyError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === DUPLICATE_KEY_ERROR_CODE
    );
  }
}
