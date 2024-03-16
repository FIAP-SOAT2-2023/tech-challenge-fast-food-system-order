import { v4 as uuidv4 } from "uuid";

import { Item } from "../../domain/entities/item";
import { Basket } from "../../domain/entities/basket";
import { Products } from "../../domain/entities/products";
import { IBasketRepository } from "../../domain/repositories/basketRepository";
import { IOrderRepository } from "../../domain/repositories/orderRepository";
import IOrderStatusRepository from "../../domain/repositories/statusRepository";
import { ICustomerRepository } from "../../domain/repositories/customerRepository";
import { IProductRepository } from "../../domain/repositories/productRepository";
import { IPaymentRepository } from "../../domain/repositories/paymentRepository";
import { IBasketUseCase } from "../../domain/usecases/IBasketUseCase";
import { Payment } from "../../domain/entities/payment";
import OrderStatusKey from "../../../framework/enum/orderStatus";
import { Order } from "../../domain/entities/order";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import "dotenv/config";
export class BasketUseCase implements IBasketUseCase {
  constructor(
    private readonly basketRepository: IBasketRepository,
    private readonly orderRepository: IOrderRepository,
    private readonly orderStatusRepository: IOrderStatusRepository,
    private readonly customerRepository: ICustomerRepository,
    private readonly productRepository: IProductRepository,
    private readonly paymentRepository: IPaymentRepository
  ) {}

  async createBasket(
    document: string,
    basketPending: Basket,
    paymentNew: Payment
  ): Promise<Basket> {
    return new Promise<Basket>(async (resolve) => {
      basketPending.customer =
        await this.customerRepository.getCustomerIdByDocument(document);
      for (const item of basketPending.items) {
        if (item.category !== undefined) {
          let result: any = await this.productRepository.getProductByCategory(
            item.category
          );

          if (result !== null) {
            basketPending.items?.push({
              unitPrice: result.unitPrice,
              productId: result.productId,
              quantity: item.quantity,
            } as Item);
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
      paymentNew.orderId = (Math.random() * 20).toString();
      let paymentId: any = await this.paymentRepository.createPayment(
        paymentNew
      );
      paymentNew = { ...paymentNew, uuid: uuidv4() };

      basketPending.payment = await this.paymentRepository.createPayment(
        paymentNew
      );
      const orderPending: Order = {
        basket: basketCreated,
        payment: basketPending.payment.id,
        status: orderStatus,
        expected: expectedOrder,
      };
      const orderCreated = await this.orderRepository.createOrder(orderPending);

      const basketResult: Basket = {
        order: orderCreated,
        ...basketCreated,
        checkoutUrl: basketPending.payment.checkoutUrl,
      };

      const sqsClient = new SQSClient({
        region: process.env.AWS_REGION,
        credentials: {
          accessKeyId: process.env.AWS_ACCESSKEY,
          secretAccessKey: process.env.AWS_SECRETKEY,
        },
      });

      let items = "";
      for (const item of basketResult.items) {
        items += `Categoria: ${item.category} quantidade: ${item.quantity} observação: ${item.observations}\n`;
      }

      //  MessageBody: `Olá o pagamento: ${basketResult.order?.payment} foi realizado com sucesso, segue número do Pedido: ${basketResult.order.code}\nDescrição dos items: ${items}
        //          `,

        const messageBody = {
            basket: basketResult,

        }

      const messageJSON = JSON.stringify(messageBody);

      console.debug("Mensagem a ser enviada: ", messageJSON)

      try {
        if (basketResult.order?.payment !== undefined) {
          const params = {
            QueueUrl: process.env.AWS_PAYMENT_QUEE01,
            MessageBody: messageJSON,
            MessageGroupId: process.env.AWS_GRUPO01,
          };
          const command = new SendMessageCommand(params);
          const response = await sqsClient.send(command);

          const params2 = {
            QueueUrl: process.env.AWS_ORDER_QUEE02,
            MessageBody: `Olá ${basketResult.customer?.firstName} o pagamento: ${basketResult.order?.payment} foi realizado com sucesso, segue número do Pedido: ${basketResult.order.code}\nEm breve receberá mensagem da preparação do pedido
         `,
            MessageGroupId: process.env.AWS_GRUPO01,
          };
          const command2 = new SendMessageCommand(params2);
          const response2 = await sqsClient.send(command2);

          console.log(
            "As Mensagem foram enviada com sucesso. ID da mensagem:",
            response.MessageId
          );
        } else {
          const params = {
            QueueUrl: process.env.AWS_COMPESATION_ORDER_QUEE01,
            MessageBody: `Houve erro no pagamento, segue número do Pedido: ${basketResult.order.code}\nFavor desfazer a reserva de itens para este pedido
         `,
            MessageGroupId: process.env.AWS_GRUPO01,
          };
          const command = new SendMessageCommand(params);
          const response = await sqsClient.send(command);

          console.log(
            "As Mensagem foram enviada com sucesso. ID da mensagem:",
            response.MessageId
          );
        }
      } catch (error) {
        console.error("Erro ao enviar mensagens para fila:", error);
      }

      resolve(basketResult);
    });
  }

  async getAllPendingOrders(): Promise<Order[]> {
    return new Promise<Order[]>(async (resolve) => {
      const orderList = await this.orderRepository.getAllPendingOrders();
      resolve(orderList);
    });
  }
}
