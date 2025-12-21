import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateOrderDto } from './dto/create-order.dto';
import { CreateOrderResponseDto, OrderResponseDto } from './dto/order-response.dto';
import { OrdersService } from './orders.service';

@ApiTags('orders')
@ApiBearerAuth()
@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new order with Stripe PaymentIntent' })
  @ApiResponse({ status: 201, description: 'Order created successfully', type: CreateOrderResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async create(
    @Request() req: { user: { userId: string } },
    @Body() createOrderDto: CreateOrderDto,
  ) {
    return this.ordersService.create(req.user.userId, createOrderDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all orders for the authenticated user' })
  @ApiResponse({ status: 200, description: 'List of orders', type: [OrderResponseDto] })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async findAll(@Request() req: { user: { userId: string } }) {
    return this.ordersService.findByUserId(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific order by ID' })
  @ApiResponse({ status: 200, description: 'Order details', type: OrderResponseDto })
  @ApiNotFoundResponse({ description: 'Order not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async findOne(
    @Param('id') id: string,
    @Request() req: { user: { userId: string } },
  ) {
    const order = await this.ordersService.findById(id);
    if (!order || order.userId.toString() !== req.user.userId) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel a pending order' })
  @ApiResponse({ status: 200, description: 'Order cancelled successfully', type: OrderResponseDto })
  @ApiNotFoundResponse({ description: 'Order not found or cannot be cancelled' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async cancel(
    @Param('id') id: string,
    @Request() req: { user: { userId: string } },
  ) {
    const order = await this.ordersService.cancelOrder(id, req.user.userId);
    if (!order) {
      throw new NotFoundException('Order not found or cannot be cancelled');
    }
    return order;
  }
}
