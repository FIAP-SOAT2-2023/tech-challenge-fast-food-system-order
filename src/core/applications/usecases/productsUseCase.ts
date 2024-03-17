import { IProductsUseCase } from "../../domain/usecases/IProductUseCase";
import { IProductRepository } from "../../domain/repositories/productRepository";
import { Products } from "../../domain/entities/products";


export class ProductsUseCase implements IProductsUseCase {
  constructor(private readonly productRepository: IProductRepository) {}

  getAllProducts(): Promise<Products[]> {
    return this.productRepository.getAllProducts();
  }
}