import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductsController } from './controllers/products.controller';
import { ProductRepository } from './repository/products.repository';
import { Product, ProductSchema } from './schemas/product.schema';
import { ProductsSeeder } from './seeders/products.seeder';
import { GetProductUseCase } from './use-cases/get-product.use-case';
import { GetProductsUseCase } from './use-cases/get-products.use-case';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),
  ],
  controllers: [ProductsController],
  providers: [
    ProductRepository,
    GetProductsUseCase,
    GetProductUseCase,
    ProductsSeeder,
  ],
  exports: [ProductRepository],
})
export class ProductsModule {}
