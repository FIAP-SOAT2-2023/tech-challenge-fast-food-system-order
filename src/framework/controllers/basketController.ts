import { Request, Response } from "express";
import { BasketRequest } from "../request/basketRequest";
import {BasketUseCase} from "../../core/applications/usecases/basketUseCase";
import {ValidationUtil} from "../validation/validateRequest";
import {Basket} from "../../core/domain/entities/basket";

export class BasketController {
  constructor(private readonly basketUseCase: BasketUseCase) {}

  async create(req: Request, res: Response) {
    const basketRequest = await ValidationUtil.validateAndTransform(
      BasketRequest,
      req.body,
      res
    );

    this.basketUseCase
      .createBasket(req.body.document, basketRequest, req.body.payment)
      .then((basketCreated: Basket) => {
        res.status(200).json({
          checkout: basketCreated.checkoutUrl,
          order: basketCreated.order,
        });
      })
      .catch((error) => {
        console.error(error);
        res.json(JSON.stringify({ message: error })).sendStatus(400);
      });
  }

  async getAllPendingOrders(req: Request, res: Response) {
    this.basketUseCase
      .getAllPendingOrders()
      .then((orders) => {
        res.status(200).json({ orders: orders });
      })
      .catch((error) => {
        console.error(error);
        res.json(JSON.stringify({ message: error })).sendStatus(400);
      });
  }
}
