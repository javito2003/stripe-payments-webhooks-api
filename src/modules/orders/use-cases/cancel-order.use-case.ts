import { Injectable } from '@nestjs/common';
import { OrderEntity, OrderStatus } from '../domain/order.entity';
import { OrderCannotBeCancelled } from '../orders.errors';
import { StripeProvider } from '../providers/stripe.provider';
import { OrderRepository } from '../repository/orders.repository';

export interface CancelOrderUseCaseParams {
  orderId: string;
  userId: string;
}

@Injectable()
export class CancelOrderUseCase {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly stripeProvider: StripeProvider,
  ) {}

  async execute(params: CancelOrderUseCaseParams): Promise<OrderEntity> {
    const order = await this.orderRepository.findPendingByIdAndUserId(
      params.orderId,
      params.userId,
    );

    if (!order) {
      throw new OrderCannotBeCancelled();
    }

    if (order.stripePaymentIntentId) {
      await this.stripeProvider.cancelPaymentIntent(
        order.stripePaymentIntentId,
      );
    }

    const updatedOrder = await this.orderRepository.updateStatus(
      order.id,
      OrderStatus.CANCELLED,
    );

    return updatedOrder!;
  }
}
