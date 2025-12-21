import { BadRequestException, NotFoundException } from '@nestjs/common';

export class ProductNotFound extends NotFoundException {
  constructor(productId: string) {
    super(`Product with ID ${productId} not found`);
  }
}

export class EmptyOrderItems extends BadRequestException {
  constructor() {
    super('Order must contain at least one item');
  }
}

export class InvalidQuantity extends BadRequestException {
  constructor() {
    super('Quantity must be greater than 0');
  }
}

export class OrderNotFound extends NotFoundException {
  constructor() {
    super('Order not found');
  }
}

export class OrderCannotBeCancelled extends BadRequestException {
  constructor() {
    super('Order not found or cannot be cancelled');
  }
}
