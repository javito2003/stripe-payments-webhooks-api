import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductsModule } from '../products/products.module';
import { OrdersController } from './controllers/orders.controller';
import { WebhooksController } from './controllers/webhooks.controller';
import { StripeProvider } from './providers/stripe.provider';
import { OrderRepository } from './repository/orders.repository';
import { WebhookEventsRepository } from './repository/webhook-events.repository';
import { Order, OrderSchema } from './schemas/order.schema';
import {
  WebhookEvent,
  WebhookEventSchema,
} from './schemas/webhook-event.schema';
import { CancelOrderUseCase } from './use-cases/cancel-order.use-case';
import { CreateOrderUseCase } from './use-cases/create-order.use-case';
import { GetOrderUseCase } from './use-cases/get-order.use-case';
import { GetOrdersUseCase } from './use-cases/get-orders.use-case';
import { HandleStripeWebhookUseCase } from './use-cases/integrations/handle-stripe-webhook.use-case';
import { SuccessPaymentHandler } from './use-cases/integrations/handlers/success.handler';
import { FailedPaymentHandler } from './use-cases/integrations/handlers/failed.handler';
import { CancelledPaymentHandler } from './use-cases/integrations/handlers/cancelled.handler';

const WebhookEventsHandlers = [
  SuccessPaymentHandler,
  FailedPaymentHandler,
  CancelledPaymentHandler,
];

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: WebhookEvent.name, schema: WebhookEventSchema },
    ]),
    ProductsModule,
  ],
  controllers: [OrdersController, WebhooksController],
  providers: [
    OrderRepository,
    WebhookEventsRepository,
    StripeProvider,
    CreateOrderUseCase,
    GetOrdersUseCase,
    GetOrderUseCase,
    CancelOrderUseCase,
    HandleStripeWebhookUseCase,
    ...WebhookEventsHandlers,
  ],
  exports: [OrderRepository],
})
export class OrdersModule {}
