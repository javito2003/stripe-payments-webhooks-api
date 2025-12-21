import {
  BadRequestException,
  Controller,
  Headers,
  Post,
  Req,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBadRequestResponse, ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import Stripe from 'stripe';
import { OrderStatus } from './schemas/order.schema';
import { OrdersService } from './orders.service';

interface RawBodyRequest extends Request {
  rawBody?: Buffer;
}

@ApiTags('webhooks')
@Controller('webhooks')
export class WebhooksController {
  private stripe: Stripe;

  constructor(
    private ordersService: OrdersService,
    private configService: ConfigService,
  ) {
    this.stripe = new Stripe(
      this.configService.get<string>('STRIPE_SECRET_KEY', ''),
    );
  }

  @Post('stripe')
  @ApiOperation({
    summary: 'Handle Stripe webhook events',
    description: 'Receives and processes Stripe webhook events (payment_intent.succeeded, payment_intent.payment_failed, payment_intent.canceled)',
  })
  @ApiHeader({ name: 'stripe-signature', description: 'Stripe webhook signature', required: true })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiBadRequestResponse({ description: 'Invalid webhook signature or missing body' })
  async handleStripeWebhook(
    @Req() req: RawBodyRequest,
    @Headers('stripe-signature') signature: string,
  ) {
    const webhookSecret = this.configService.get<string>(
      'STRIPE_WEBHOOK_SECRET',
      '',
    );

    if (!req.rawBody) {
      throw new BadRequestException('Missing raw body');
    }

    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        req.rawBody,
        signature,
        webhookSecret,
      );
    } catch (err) {
      throw new BadRequestException(`Webhook signature verification failed`);
    }

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await this.ordersService.updateOrderStatus(
          paymentIntent.id,
          OrderStatus.PAID,
        );
        break;
      }
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await this.ordersService.updateOrderStatus(
          paymentIntent.id,
          OrderStatus.FAILED,
        );
        break;
      }
      case 'payment_intent.canceled': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await this.ordersService.updateOrderStatus(
          paymentIntent.id,
          OrderStatus.CANCELLED,
        );
        break;
      }
    }

    return { received: true };
  }
}
