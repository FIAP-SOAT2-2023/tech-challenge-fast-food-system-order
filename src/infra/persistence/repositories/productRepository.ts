import { IProductRepository } from "../../../core/domain/repositories/productRepository";
import { Products } from "../../../core/domain/entities/products";
import ProductModel from "../models/productsModel";

export class ProductRepository implements IProductRepository {
  getProductByCategory(category: string): Promise<Products> {
    return new Promise<Products>(async (resolve, reject) => {
      const product = await ProductModel.findOne({
        where: {
          category,
        },
      });
      if (!product) {
        reject("Produto não encontrado.");
      }
      resolve({
        productId: product.id,
        unitPrice: product.unitPrice,
      } as Products);
    });
  }
}
