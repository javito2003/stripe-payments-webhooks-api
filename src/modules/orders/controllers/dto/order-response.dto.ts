import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus } from '../../domain/order.entity';

export class OrderItemResponseDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  productId: string;

  @ApiProperty({ example: 'Premium Headphones' })
  productName: string;

  @ApiProperty({ example: 2 })
  quantity: number;

  @ApiProperty({ example: 9999, description: 'Unit price in cents' })
  unitPrice: number;
}

export class OrderResponseDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  id: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  userId: string;

  @ApiProperty({ type: [OrderItemResponseDto] })
  items: OrderItemResponseDto[];

  @ApiProperty({ example: 19998, description: 'Total amount in cents' })
  totalAmount: number;

  @ApiProperty({ example: 'usd' })
  currency: string;

  @ApiProperty({ enum: OrderStatus, example: OrderStatus.PENDING })
  status: OrderStatus;

  @ApiProperty({ example: 'pi_3abc123def456' })
  stripePaymentIntentId: string;

  @ApiPropertyOptional({ example: '2024-01-15T10:30:00.000Z' })
  paidAt?: Date;

  @ApiProperty({ example: '2024-01-15T10:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-15T10:00:00.000Z' })
  updatedAt: Date;
}

export class CreateOrderResponseDto {
  @ApiProperty({ type: OrderResponseDto })
  order: OrderResponseDto;

  @ApiProperty({
    example: 'pi_3abc123def456_secret_xyz',
    description: 'Stripe client secret for payment confirmation',
  })
  clientSecret: string;
}
