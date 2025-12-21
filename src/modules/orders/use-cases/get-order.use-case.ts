import { Injectable } from '@nestjs/common';
import { OrderEntity } from '../domain/order.entity';
import { OrderNotFound } from '../orders.errors';
import { OrderRepository } from '../repository/orders.repository';

export interface GetOrderUseCaseParams {
  orderId: string;
  userId: string;
}

@Injectable()
export class GetOrderUseCase {
  constructor(private readonly orderRepository: OrderRepository) {}

  async execute(params: GetOrderUseCaseParams): Promise<OrderEntity> {
    const order = await this.orderRepository.findByIdAndUserId(
      params.orderId,
      params.userId,
    );

    if (!order) {
      throw new OrderNotFound();
    }

    return order;
  }
}
