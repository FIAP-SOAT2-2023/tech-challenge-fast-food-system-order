import { Request, Response } from "express";
import {ProductsUseCase} from "../../core/applications/usecases/productsUseCase";


export class ProductController {

  constructor(private readonly productUseCase: ProductsUseCase) { }

  async getAllProducts(req: Request, res: Response) {
    const result = await this.productUseCase.getAllProducts();
    res.status(200).json(result);
  }
}
