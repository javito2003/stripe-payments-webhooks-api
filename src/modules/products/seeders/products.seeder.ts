import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ProductRepository } from '../repository/products.repository';

const MOCK_PRODUCTS = [
  {
    name: 'Premium Headphones',
    description:
      'High-quality wireless headphones with active noise cancellation',
    price: 9999,
    currency: 'usd',
    imageUrl:
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
  },
  {
    name: 'Mechanical Keyboard',
    description: 'RGB mechanical keyboard with Cherry MX switches',
    price: 14999,
    currency: 'usd',
    imageUrl:
      'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=400',
  },
  {
    name: 'Wireless Mouse',
    description: 'Ergonomic wireless mouse with precision tracking',
    price: 4999,
    currency: 'usd',
    imageUrl:
      'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400',
  },
  {
    name: '4K Monitor',
    description: '27-inch 4K UHD monitor with HDR support',
    price: 34999,
    currency: 'usd',
    imageUrl:
      'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400',
  },
  {
    name: 'USB-C Hub',
    description: 'Multi-port USB-C hub with HDMI and SD card reader',
    price: 5999,
    currency: 'usd',
    imageUrl:
      'https://images.unsplash.com/photo-1625723044792-44de16ccb4e9?w=400',
  },
  {
    name: 'Laptop Stand',
    description: 'Adjustable aluminum laptop stand for better ergonomics',
    price: 3999,
    currency: 'usd',
    imageUrl:
      'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=400',
  },
];

@Injectable()
export class ProductsSeeder implements OnModuleInit {
  private readonly logger = new Logger(ProductsSeeder.name);

  constructor(private readonly productRepository: ProductRepository) {}

  async onModuleInit() {
    await this.seed();
  }

  async seed() {
    const count = await this.productRepository.count();

    if (count > 0) {
      this.logger.log(`Products already seeded (${count} products found)`);
      return;
    }

    this.logger.log('Seeding products...');
    await this.productRepository.createMany(MOCK_PRODUCTS);
    this.logger.log(`Seeded ${MOCK_PRODUCTS.length} products`);
  }
}
