import { Injectable } from '@nestjs/common';
import { OrderEntity } from '../domain/order.entity';
import { OrderRepository } from '../repository/orders.repository';

export interface GetOrdersUseCaseParams {
  userId: string;
}

@Injectable()
export class GetOrdersUseCase {
  constructor(private readonly orderRepository: OrderRepository) {}

  async execute(params: GetOrdersUseCaseParams): Promise<OrderEntity[]> {
    return this.orderRepository.findByUserId(params.userId);
  }
}
