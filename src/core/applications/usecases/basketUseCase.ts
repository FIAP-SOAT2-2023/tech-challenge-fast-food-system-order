import {v4 as uuidv4} from "uuid";

import {Item} from "../../domain/entities/item";
import {Basket} from "../../domain/entities/basket";
import {Products} from "../../domain/entities/products";
import {IBasketRepository} from "../../domain/repositories/basketRepository";
import {IOrderRepository} from "../../domain/repositories/orderRepository";
import IOrderStatusRepository from "../../domain/repositories/statusRepository";
import {ICustomerRepository} from "../../domain/repositories/customerRepository";
import {IProductRepository} from "../../domain/repositories/productRepository";
import {IPaymentRepository} from "../../domain/repositories/paymentRepository";
import {IBasketUseCase} from "../../domain/usecases/IBasketUseCase";
import {Payment} from "../../domain/entities/payment";
import OrderStatusKey from "../../../framework/enum/orderStatus";
import {Order} from "../../domain/entities/order";
import {SQSClient, SendMessageCommand} from "@aws-sdk/client-sqs";
import "dotenv/config";
import orderStatus from "../../../framework/enum/orderStatus";

export class BasketUseCase implements IBasketUseCase {
    constructor(
        private readonly basketRepository: IBasketRepository,
        private readonly orderRepository: IOrderRepository,
        private readonly orderStatusRepository: IOrderStatusRepository,
        private readonly customerRepository: ICustomerRepository,
        private readonly productRepository: IProductRepository,
        private readonly paymentRepository: IPaymentRepository
    ) {
    }

    async createBasket(
        document: string,
        basketPending: Basket,
        paymentNew: Payment
    ): Promise<Basket> {
        return new Promise<Basket>(async (resolve) => {

            basketPending.customer =
                await this.customerRepository.getCustomerIdByDocument(document);

            basketPending.payment = paymentNew;


            for (const item of basketPending.items) {
                if (item.category !== undefined) {
                    let result: any = await this.productRepository.getProductByCategory(
                        item.category
                    );

                    if (result !== null) {

                        item.productId = result.productId;
                        item.unitPrice = result.unitPrice;
                    }

                }
            }
            const basketCreated = await this.basketRepository.createBasket(
                basketPending
            );
            const orderStatus = await this.orderStatusRepository.getByKey(
                OrderStatusKey.RECEIVED
            );

            let expectedOrder = new Date();

            expectedOrder.setHours(expectedOrder.getHours() * 4);

            const uuid = "PAY-" + uuidv4();

            const orderPending: Order = {
                basket: basketCreated,
                payment: uuid,
                status: orderStatus,
                expected: expectedOrder,
            };

            const orderCreated = await this.orderRepository.createOrder(orderPending);

            const basketResult: Basket = {
                order: orderCreated,
                ...basketCreated,
                checkoutUrl: basketPending.payment.checkoutUrl,
            };


            await this.paymentRepository.createPayment(basketResult, basketPending?.customer);


            resolve(basketResult);
        });
    }

    async getAllPendingOrders(): Promise<Order[]> {
        return new Promise<Order[]>(async (resolve) => {
            const orderList = await this.orderRepository.getAllPendingOrders();
            resolve(orderList);
        });
    }


    async cancelBasket(basketId: string): Promise<void> {
        return new Promise<void>(async (resolve) => {
            const basket = await this.basketRepository.findBasketById(basketId);
            if (basket) {
                const order = await this.orderRepository.findOrderByUUID(basket.order.uuid);
                if (order) {
                    const orderStatus = await this.orderStatusRepository.getByKey(
                        OrderStatusKey.REVERSED
                    );
                    order.status = orderStatus;
                    await this.orderRepository.updateOrderById(basket.order.uuid, order);
                }
            }
            resolve();
        });
    }
}
