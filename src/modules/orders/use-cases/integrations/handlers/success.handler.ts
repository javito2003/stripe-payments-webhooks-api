import { Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { OrderStatus } from '../../../domain/order.entity';
import { OrderRepository } from '../../../repository/orders.repository';
import { WebhookEventHandler } from './handler.interface';

@Injectable()
export class SuccessPaymentHandler implements WebhookEventHandler {
  private readonly logger = new Logger(SuccessPaymentHandler.name);

  constructor(private readonly orderRepository: OrderRepository) {}

  async handle(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    await this.orderRepository.updateStatusByPaymentIntentId(
      paymentIntent.id,
      OrderStatus.PAID,
      new Date(),
    );

    // Add your custom logic here:
    // - Send confirmation email
    // - Update inventory
    // - Trigger fulfillment process
    // - Emit events for other services

    this.logger.log(
      `Order marked as PAID for payment intent ${paymentIntent.id}`,
    );
  }
}
