import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { CancelOrderUseCase } from '../use-cases/cancel-order.use-case';
import { CreateOrderUseCase } from '../use-cases/create-order.use-case';
import { GetOrderUseCase } from '../use-cases/get-order.use-case';
import { GetOrdersUseCase } from '../use-cases/get-orders.use-case';
import { CreateOrderDto } from './dto/create-order.dto';
import {
  CreateOrderResponseDto,
  OrderResponseDto,
} from './dto/order-response.dto';

@ApiTags('orders')
@ApiBearerAuth()
@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(
    private readonly createOrderUseCase: CreateOrderUseCase,
    private readonly getOrdersUseCase: GetOrdersUseCase,
    private readonly getOrderUseCase: GetOrderUseCase,
    private readonly cancelOrderUseCase: CancelOrderUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new order with products' })
  @ApiResponse({
    status: 201,
    description: 'Order created successfully',
    type: CreateOrderResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid items or product not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async create(
    @CurrentUser('userId') userId: string,
    @Body() createOrderDto: CreateOrderDto,
  ) {
    const data = await this.createOrderUseCase.execute({
      userId,
      items: createOrderDto.items,
      currency: createOrderDto.currency,
    });

    return {
      clientSecret: data.clientSecret,
      orderId: data.order.id,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all orders for the authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'List of orders',
    type: [OrderResponseDto],
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  findAll(@CurrentUser('userId') userId: string) {
    return this.getOrdersUseCase.execute({ userId });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific order by ID' })
  @ApiResponse({
    status: 200,
    description: 'Order details',
    type: OrderResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Order not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  findOne(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    return this.getOrderUseCase.execute({
      orderId: id,
      userId,
    });
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel a pending order' })
  @ApiResponse({
    status: 200,
    description: 'Order cancelled successfully',
    type: OrderResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Order cannot be cancelled' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  cancel(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    return this.cancelOrderUseCase.execute({
      orderId: id,
      userId,
    });
  }
}
