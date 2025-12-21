import { Injectable } from '@nestjs/common';
import { ProductRepository } from '../../products/repository/products.repository';
import { OrderEntity, OrderItem } from '../domain/order.entity';
import {
  EmptyOrderItems,
  InvalidQuantity,
  ProductNotFound,
} from '../orders.errors';
import { StripeProvider } from '../providers/stripe.provider';
import { OrderRepository } from '../repository/orders.repository';
import { ProductEntity } from 'src/modules/products/domain/product.entity';
import arrayUtils from 'src/shared/utils/array';

export interface CreateOrderItemParams {
  productId: string;
  quantity: number;
}

export interface CreateOrderUseCaseParams {
  userId: string;
  items: CreateOrderItemParams[];
  currency?: string;
}

export interface CreateOrderUseCaseResult {
  order: OrderEntity;
  clientSecret: string;
}

@Injectable()
export class CreateOrderUseCase {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly productRepository: ProductRepository,
    private readonly stripeProvider: StripeProvider,
  ) {}

  private async validateProducts(
    items: CreateOrderUseCaseParams['items'],
  ): Promise<ProductEntity[]> {
    const existProducts = await this.productRepository.findByIds(
      items.map((item) => item.productId),
    );
    if (existProducts.length !== items.length) {
      const existProductIds = existProducts.map((p) => p.id);
      const missingProduct = items.find(
        (item) => !existProductIds.includes(item.productId),
      );
      throw new ProductNotFound(missingProduct!.productId);
    }

    return existProducts;
  }

  private validateQuantities(items: CreateOrderUseCaseParams['items']): void {
    const hasSomeInvalidQuantity = items.some((item) => item.quantity < 1);
    if (hasSomeInvalidQuantity) {
      throw new InvalidQuantity();
    }
  }

  async execute(
    params: CreateOrderUseCaseParams,
  ): Promise<CreateOrderUseCaseResult> {
    if (!params.items || params.items.length === 0) {
      throw new EmptyOrderItems();
    }

    let totalAmount = 0;

    const products = await this.validateProducts(params.items);
    this.validateQuantities(params.items);

    const findablePrduct = arrayUtils.arrayToMap(products, 'id');

    const orderItems: OrderItem[] = params.items.map((item) => {
      const product = findablePrduct.get(item.productId)!;
      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;

      return {
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        unitPrice: product.price,
      };
    });

    const currency = params.currency || 'usd';

    const paymentIntent = await this.stripeProvider.createPaymentIntent({
      amount: totalAmount,
      currency,
      metadata: { userId: params.userId },
    });

    const order = await this.orderRepository.create({
      userId: params.userId,
      items: orderItems,
      totalAmount,
      currency,
      stripePaymentIntentId: paymentIntent.id,
    });

    return {
      order,
      clientSecret: paymentIntent.clientSecret,
    };
  }
}
