import { Order } from "../entities/order";
import OrderModel from "../../../infra/persistence/models/orderModel";


export interface IOrderRepository {
  createOrder(orderNew: Order): Promise<Order>;

  getAllPendingOrders(): Promise<Order[]>;

  updateOrderByPaymentId(id: string, body: Order): Promise<Order>

  findOrderByUUID(uuid: string): Promise<Order>;
}