import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import Stripe from 'stripe';
import { CreateOrderDto } from './dto/create-order.dto';
import { Order, OrderDocument, OrderStatus } from './schemas/order.schema';

@Injectable()
export class OrdersService {
  private stripe: Stripe;

  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    private configService: ConfigService,
  ) {
    this.stripe = new Stripe(
      this.configService.get<string>('STRIPE_SECRET_KEY', ''),
    );
  }

  async create(
    userId: string,
    createOrderDto: CreateOrderDto,
  ): Promise<{ order: OrderDocument; clientSecret: string }> {
    const currency = createOrderDto.currency || 'usd';

    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: createOrderDto.amount,
      currency,
      metadata: { userId },
    });

    const order = new this.orderModel({
      userId: new Types.ObjectId(userId),
      amount: createOrderDto.amount,
      currency,
      status: OrderStatus.PENDING,
      stripePaymentIntentId: paymentIntent.id,
    });

    await order.save();

    return {
      order,
      clientSecret: paymentIntent.client_secret!,
    };
  }

  async findByUserId(userId: string): Promise<OrderDocument[]> {
    return this.orderModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findById(orderId: string): Promise<OrderDocument | null> {
    return this.orderModel.findById(orderId).exec();
  }

  async updateOrderStatus(
    paymentIntentId: string,
    status: OrderStatus,
  ): Promise<OrderDocument | null> {
    const updateData: Partial<Order> = { status };

    if (status === OrderStatus.PAID) {
      updateData.paidAt = new Date();
    }

    return this.orderModel
      .findOneAndUpdate(
        { stripePaymentIntentId: paymentIntentId },
        updateData,
        { new: true },
      )
      .exec();
  }

  async cancelOrder(
    orderId: string,
    userId: string,
  ): Promise<OrderDocument | null> {
    const order = await this.orderModel.findOne({
      _id: new Types.ObjectId(orderId),
      userId: new Types.ObjectId(userId),
      status: OrderStatus.PENDING,
    });

    if (!order) {
      return null;
    }

    if (order.stripePaymentIntentId) {
      await this.stripe.paymentIntents.cancel(order.stripePaymentIntentId);
    }

    order.status = OrderStatus.CANCELLED;
    return order.save();
  }
}
