import { Payment } from "../entities/payment";
import {Basket} from "../entities/basket";

export interface IPaymentRepository {
 // createPayment(body: Payment): void;
  createPayment(basketResult: Basket, customer: String): Promise<void>
}
