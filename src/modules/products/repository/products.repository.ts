import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ProductEntity } from '../domain/product.entity';
import { Product, ProductDocument } from '../schemas/product.schema';

@Injectable()
export class ProductRepository {
  constructor(
    @InjectModel(Product.name) private productModel: Model<Product>,
  ) {}

  private toEntity(product: ProductDocument): ProductEntity {
    return {
      id: product._id.toString(),
      name: product.name,
      description: product.description,
      price: product.price,
      currency: product.currency,
      imageUrl: product.imageUrl,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }

  async findAll(): Promise<ProductEntity[]> {
    const products = await this.productModel.find().exec();
    return products.map((product) => this.toEntity(product as ProductDocument));
  }

  async findById(id: string): Promise<ProductEntity | null> {
    const product = await this.productModel.findById(id).exec();
    return product ? this.toEntity(product as ProductDocument) : null;
  }

  async findByIds(ids: string[]): Promise<ProductEntity[]> {
    const products = await this.productModel.find({ _id: { $in: ids } }).exec();
    return products.map((product) => this.toEntity(product as ProductDocument));
  }

  async count(): Promise<number> {
    return this.productModel.countDocuments().exec();
  }

  async createMany(
    products: Omit<ProductEntity, 'id' | 'createdAt' | 'updatedAt'>[],
  ): Promise<void> {
    await this.productModel.insertMany(products);
  }
}
