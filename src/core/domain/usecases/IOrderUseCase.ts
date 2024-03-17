import { Order } from "../entities/order";


export interface IOrderUseCase {

    updateOrderByPaymentId(id: string, body: Order): Promise<Order>

}
