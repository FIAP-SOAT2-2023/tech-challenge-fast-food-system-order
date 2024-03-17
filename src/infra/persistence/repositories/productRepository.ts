import { IProductRepository } from "../../../core/domain/repositories/productRepository";
import { Products } from "../../../core/domain/entities/products";
import ProductModel from "../models/productsModel";

export class ProductRepository implements IProductRepository {
  async getProductByCategory(category: string): Promise<Products> {
    const product = await ProductModel.findOne({
      where: {
        category,
      },
    });
    if (!product) {
      throw new Error("Produto não encontrado.");
    }
    return {
      productId: product.id,
      unitPrice: product.unitPrice,
    } as Products;
  }

  async getAllProducts(): Promise<Products[]> {
    const products = await ProductModel.findAll({
      attributes: {
        exclude: ["id"],
      },
    });

    const mappedProducts: Products[] = products.map(product => ({
      productId: product.id,
      unitPrice: product.unitPrice,
      quantity: 0,
      category: product.category,
    }));

    return mappedProducts;
  }

}
