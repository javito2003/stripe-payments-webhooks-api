import { ApiProperty } from '@nestjs/swagger';

export class ProductResponseDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  id: string;

  @ApiProperty({ example: 'Premium Headphones' })
  name: string;

  @ApiProperty({ example: 'High-quality wireless headphones with noise cancellation' })
  description: string;

  @ApiProperty({ example: 9999, description: 'Price in cents' })
  price: number;

  @ApiProperty({ example: 'usd' })
  currency: string;

  @ApiProperty({ example: 'https://example.com/headphones.jpg' })
  imageUrl: string;

  @ApiProperty({ example: '2024-01-15T10:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-15T10:00:00.000Z' })
  updatedAt: Date;
}
