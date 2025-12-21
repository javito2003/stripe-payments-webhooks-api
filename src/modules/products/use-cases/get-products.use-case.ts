import { Injectable } from '@nestjs/common';
import { ProductEntity } from '../domain/product.entity';
import { ProductRepository } from '../repository/products.repository';

@Injectable()
export class GetProductsUseCase {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(): Promise<ProductEntity[]> {
    return this.productRepository.findAll();
  }
}
