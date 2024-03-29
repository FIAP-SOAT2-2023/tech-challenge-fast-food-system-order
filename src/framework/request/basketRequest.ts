import { Length, IsNotEmpty, Max, Min } from "class-validator";
import { ItemRequest } from "./ItemRequest";
import {Basket} from "../../core/domain/entities/basket";
import {Order} from "../../core/domain/entities/order";


export class BasketRequest implements Basket {
  declare id: number;

  declare uuid?: string;

  @IsNotEmpty({ message: "document is required" })
  declare document?: string;

  @Max(100000, { message: "Total Price should be between 2 and 10 characters" })
  @Min(2, { message: "Total Price should be between 2 and 10 characters" })
  @IsNotEmpty({ message: "Total Price is required" })
  declare totalPrice?: number;

  declare isTakeOut?: boolean;

  declare createdAt?: Date;

  @IsNotEmpty({ message: "Item is required" })
  declare items: ItemRequest[];

  declare order?: Order;

  declare paymentId?: string;
}
