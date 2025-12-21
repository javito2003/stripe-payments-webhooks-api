import {
  BadRequestException,
  Controller,
  Headers,
  Post,
  Req,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { HandleStripeWebhookUseCase } from '../use-cases/integrations/handle-stripe-webhook.use-case';

interface RawBodyRequest extends Request {
  rawBody?: Buffer;
}

@ApiTags('webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(
    private readonly HandleStripeWebhookUseCase: HandleStripeWebhookUseCase,
  ) {}

  @Post('stripe')
  @ApiOperation({
    summary: 'Handle Stripe webhook events',
    description:
      'Receives and processes Stripe webhook events (payment_intent.succeeded, payment_intent.payment_failed, payment_intent.canceled)',
  })
  @ApiHeader({
    name: 'stripe-signature',
    description: 'Stripe webhook signature',
    required: true,
  })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiBadRequestResponse({
    description: 'Invalid webhook signature or missing body',
  })
  handleStripeWebhook(
    @Req() req: RawBodyRequest,
    @Headers('stripe-signature') signature: string,
  ) {
    if (!req.rawBody) {
      throw new BadRequestException('Missing raw body');
    }

    return this.HandleStripeWebhookUseCase.execute({
      payload: req.rawBody,
      signature,
    });
  }
}
