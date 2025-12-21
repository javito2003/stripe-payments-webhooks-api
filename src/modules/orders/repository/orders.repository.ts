import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { OrderEntity, OrderItem, OrderStatus } from '../domain/order.entity';
import { Order, OrderDocument } from '../schemas/order.schema';

@Injectable()
export class OrderRepository {
  constructor(@InjectModel(Order.name) private orderModel: Model<Order>) {}

  private toEntity(order: OrderDocument): OrderEntity {
    return {
      id: order._id.toString(),
      userId: order.userId.toString(),
      items: order.items.map((item) => ({
        productId: item.productId.toString(),
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      totalAmount: order.totalAmount,
      currency: order.currency,
      status: order.status,
      stripePaymentIntentId: order.stripePaymentIntentId,
      paidAt: order.paidAt,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }

  async create(data: {
    userId: string;
    items: OrderItem[];
    totalAmount: number;
    currency: string;
    stripePaymentIntentId: string;
  }): Promise<OrderEntity> {
    const order = new this.orderModel({
      userId: new Types.ObjectId(data.userId),
      items: data.items.map((item) => ({
        productId: new Types.ObjectId(item.productId),
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      totalAmount: data.totalAmount,
      currency: data.currency,
      status: OrderStatus.PENDING,
      stripePaymentIntentId: data.stripePaymentIntentId,
    });

    const savedOrder = await order.save();
    return this.toEntity(savedOrder as OrderDocument);
  }

  async findByUserId(userId: string): Promise<OrderEntity[]> {
    const orders = await this.orderModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .exec();

    return orders.map((order) => this.toEntity(order as OrderDocument));
  }

  async findById(orderId: string): Promise<OrderEntity | null> {
    const order = await this.orderModel.findById(orderId).exec();
    return order ? this.toEntity(order as OrderDocument) : null;
  }

  async findByIdAndUserId(
    orderId: string,
    userId: string,
  ): Promise<OrderEntity | null> {
    const order = await this.orderModel
      .findOne({
        _id: new Types.ObjectId(orderId),
        userId: new Types.ObjectId(userId),
      })
      .exec();

    return order ? this.toEntity(order as OrderDocument) : null;
  }

  async findPendingByIdAndUserId(
    orderId: string,
    userId: string,
  ): Promise<OrderEntity | null> {
    const order = await this.orderModel
      .findOne({
        _id: new Types.ObjectId(orderId),
        userId: new Types.ObjectId(userId),
        status: OrderStatus.PENDING,
      })
      .exec();

    return order ? this.toEntity(order as OrderDocument) : null;
  }

  async updateStatus(
    orderId: string,
    status: OrderStatus,
    paidAt?: Date,
  ): Promise<OrderEntity | null> {
    const updateData: Partial<Order> = { status };
    if (paidAt) {
      updateData.paidAt = paidAt;
    }

    const order = await this.orderModel
      .findByIdAndUpdate(orderId, updateData, { new: true })
      .exec();

    return order ? this.toEntity(order as OrderDocument) : null;
  }

  async updateStatusByPaymentIntentId(
    paymentIntentId: string,
    status: OrderStatus,
    paidAt?: Date,
  ): Promise<OrderEntity | null> {
    const updateData: Partial<Order> = { status };
    if (paidAt) {
      updateData.paidAt = paidAt;
    }

    const order = await this.orderModel
      .findOneAndUpdate(
        { stripePaymentIntentId: paymentIntentId },
        updateData,
        { new: true },
      )
      .exec();

    return order ? this.toEntity(order as OrderDocument) : null;
  }
}
