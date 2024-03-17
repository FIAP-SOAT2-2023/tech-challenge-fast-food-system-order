import { Basket } from "../entities/basket";

export interface IBasketRepository {
  createBasket(basketNew: Basket): Promise<Basket>;
  findBasketById(uuid: string): Promise<Basket>
}