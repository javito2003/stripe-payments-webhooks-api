import { Injectable, NotFoundException } from '@nestjs/common';
import { ProductEntity } from '../domain/product.entity';
import { ProductRepository } from '../repository/products.repository';

export interface GetProductUseCaseParams {
  id: string;
}

@Injectable()
export class GetProductUseCase {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(params: GetProductUseCaseParams): Promise<ProductEntity> {
    const product = await this.productRepository.findById(params.id);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }
}
