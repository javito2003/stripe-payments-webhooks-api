import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({ example: 1000, description: 'Amount in cents (e.g., 1000 = $10.00)' })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiPropertyOptional({ example: 'usd', description: 'Currency code (default: usd)', default: 'usd' })
  @IsString()
  @IsOptional()
  currency?: string;
}
