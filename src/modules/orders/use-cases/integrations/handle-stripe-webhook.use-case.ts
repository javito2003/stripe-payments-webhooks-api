import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import {
  StripeProvider,
  WEBHOOK_EVENTS,
} from '../../providers/stripe.provider';
import { WebhookEventsRepository } from '../../repository/webhook-events.repository';
import { WebhookEventHandler } from './handlers/webhook-event.handler';
import { SuccessPaymentHandler } from './handlers/success-payment.handler';
import { FailedPaymentHandler } from './handlers/failed-payment.handler';
import { CancelledPaymentHandler } from './handlers/cancelled-payment.handler';

export interface HandleStripeWebhookUseCaseParams {
  payload: Buffer;
  signature: string;
}

@Injectable()
export class HandleStripeWebhookUseCase {
  private readonly logger = new Logger(HandleStripeWebhookUseCase.name);
  private readonly handlers: Map<string, WebhookEventHandler>;

  constructor(
    private readonly webhookEventsRepository: WebhookEventsRepository,
    private readonly stripeProvider: StripeProvider,
    private readonly successHandler: SuccessPaymentHandler,
    private readonly failedHandler: FailedPaymentHandler,
    private readonly cancelledHandler: CancelledPaymentHandler,
  ) {
    this.handlers = new Map([
      [WEBHOOK_EVENTS.PAYMENT_INTENT_SUCCEEDED, this.successHandler],
      [WEBHOOK_EVENTS.PAYMENT_INTENT_FAILED, this.failedHandler],
      [WEBHOOK_EVENTS.PAYMENT_INTENT_CANCELED, this.cancelledHandler],
    ]);
  }

  async execute(
    params: HandleStripeWebhookUseCaseParams,
  ): Promise<{ received: true }> {
    const event = this.verifyAndParseEvent(params);

    const acquired = await this.webhookEventsRepository.tryAcquire(
      event.id,
      event.type,
    );

    if (!acquired) {
      this.logger.log(`Webhook event ${event.id} already processed, skipping`);
      return { received: true };
    }

    await this.processEvent(event);

    return { received: true };
  }

  private verifyAndParseEvent(
    params: HandleStripeWebhookUseCaseParams,
  ): Stripe.Event {
    try {
      return this.stripeProvider.constructWebhookEvent(
        params.payload,
        params.signature,
      );
    } catch {
      throw new BadRequestException('Webhook signature verification failed');
    }
  }

  private async processEvent(event: Stripe.Event): Promise<void> {
    const handler = this.handlers.get(event.type);

    if (!handler) {
      this.logger.warn(`No handler for event type: ${event.type}`);
      return;
    }

    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    await handler.handle(paymentIntent);
  }
}
