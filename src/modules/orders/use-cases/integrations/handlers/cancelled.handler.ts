import { Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { OrderStatus } from '../../../domain/order.entity';
import { OrderRepository } from '../../../repository/orders.repository';
import { WebhookEventHandler } from './webhook-event.handler';

@Injectable()
export class CancelledPaymentHandler implements WebhookEventHandler {
  private readonly logger = new Logger(CancelledPaymentHandler.name);

  constructor(private readonly orderRepository: OrderRepository) {}

  async handle(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    await this.orderRepository.updateStatusByPaymentIntentId(
      paymentIntent.id,
      OrderStatus.CANCELLED,
    );

    // Add your custom logic here:
    // - Release reserved inventory
    // - Send cancellation email

    this.logger.log(
      `Order marked as CANCELLED for payment intent ${paymentIntent.id}`,
    );
  }
}
