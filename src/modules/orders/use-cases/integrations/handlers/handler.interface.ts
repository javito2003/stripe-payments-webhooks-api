import Stripe from 'stripe';

export interface WebhookEventHandler {
  handle(paymentIntent: Stripe.PaymentIntent): Promise<void>;
}
