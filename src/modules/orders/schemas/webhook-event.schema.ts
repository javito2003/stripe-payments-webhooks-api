import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type WebhookEventDocument = HydratedDocument<WebhookEvent>;

@Schema()
export class WebhookEvent {
  @Prop({ required: true, unique: true, index: true })
  eventId: string;

  @Prop({ required: true })
  eventType: string;

  @Prop({ required: true, default: () => new Date(), expires: 259200 }) // TTL: 3 days (259200 seconds)
  processedAt: Date;
}

export const WebhookEventSchema = SchemaFactory.createForClass(WebhookEvent);
