import { Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { OrderStatus } from '../../../domain/order.entity';
import { OrderRepository } from '../../../repository/orders.repository';
import { WebhookEventHandler } from './webhook-event.handler';

@Injectable()
export class FailedPaymentHandler implements WebhookEventHandler {
  private readonly logger = new Logger(FailedPaymentHandler.name);

  constructor(private readonly orderRepository: OrderRepository) {}

  async handle(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    await this.orderRepository.updateStatusByPaymentIntentId(
      paymentIntent.id,
      OrderStatus.FAILED,
    );

    // Add your custom logic here:
    // - Send failure notification email
    // - Log failure reason from paymentIntent.last_payment_error
    // - Trigger retry logic

    this.logger.log(
      `Order marked as FAILED for payment intent ${paymentIntent.id}`,
    );
  }
}
