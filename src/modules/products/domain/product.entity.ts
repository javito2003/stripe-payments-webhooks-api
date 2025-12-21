export interface ProductEntity {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  imageUrl: string;
  createdAt: Date;
  updatedAt: Date;
}
