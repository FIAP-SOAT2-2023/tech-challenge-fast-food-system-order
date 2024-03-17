import { Products } from "../entities/products";

export interface IProductsUseCase {

    getAllProducts(): Promise<Products[]>;

}
