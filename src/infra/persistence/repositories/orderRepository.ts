import { Op, Sequelize } from "sequelize";
import OrderStatusModel from "../models/orderStatusModel";
import OrderStatusKey from "../../../framework/enum/orderStatus";
import { IOrderRepository } from "../../../core/domain/repositories/orderRepository";
import BasketModel from "../models/basketsModel";
import OrderModel from "../models/orderModel";
import ItemModel from "../models/itemModel";
import { Order } from "../../../core/domain/entities/order";

export class OrderRepository implements IOrderRepository {

  async findOrderByUUID(uuid: string): Promise<Order> {
    return new Promise<Order>(async (resolve, reject) => {
      const orderModel = await OrderModel.findOne({where: {paymentId: uuid}});
      if (orderModel) {
        const orderStatusModel = await OrderStatusModel.findOne({where: {id: orderModel.statusId}});
        const orderResult = {...orderModel.dataValues, status: orderStatusModel};
        resolve(orderResult)
      }
      else reject();
    });
  }



  async createOrder(orderNew: Order): Promise<Order> {
    return new Promise<Order>(async (resolve) => {
      const { basket, payment, status } = orderNew;

      const basketModel = await BasketModel.findOne({
        where: { uuid: basket?.uuid },
      });

      const orderStatusModel = await OrderStatusModel.findOne({
        where: { key: status.key },
      });

      const codeNumber = basketModel ? basketModel.id * 2 : 1;
      const codeNew = `ORD-${codeNumber}${payment}`;

      let orderCreated = await OrderModel.create({
        statusId: orderStatusModel?.id,
        basketId: basketModel?.id,
        paymentId: payment,
        expected: orderNew.expected,
        code: codeNew,
      });

      const {
        uuid,
        status: statusCreated,
        expected,
        createdAt,
        code,
      } = orderCreated;

      const orderResult = {
        ...orderNew,
        uuid,
        statusCreated,
        expected,
        createdAt,
        code,
      };

      resolve(orderResult);
    });
  }

  async getAllPendingOrders(): Promise<Order[]> {
    return new Promise<Order[]>(async (resolve, reject) => {
      const listOrdersFromDatabase = await OrderModel.findAll({
        include: [
          {
            model: OrderStatusModel,
            as: "status",
            where: {
              key: {
                [Op.not]: OrderStatusKey.DONE,
              },
            },
          },
        ],
        order: [
          [
            Sequelize.fn(
              "FIELD",
              Sequelize.col("status.key"),
              OrderStatusKey.READY,
              OrderStatusKey.PREPARATION,
              OrderStatusKey.RECEIVED
            ),
            "ASC",
          ],
          ["createdAt", "DESC"],
        ],
      });

      let orderList: Order[] = [];
      for (const orderFromDatabase of listOrdersFromDatabase) {
        const basket = await BasketModel.findOne({
          where: {
            id: orderFromDatabase.basketId,
          },
        });

        if (basket != null)
          basket.items = await ItemModel.findAll({
            where: {
              basketId: basket?.id,
            },
          });

        let order: Order = {
          uuid: orderFromDatabase.uuid,
          doneAt: orderFromDatabase.doneAt,
          expected: orderFromDatabase.expected,
          createdAt: orderFromDatabase.createdAt,

          status: {
            key: orderFromDatabase?.status?.key as string,
            name: orderFromDatabase?.status?.name as string,
          },
          basket: {
            totalPrice: basket?.totalPrice,
            isTakeOut: basket?.isTakeOut,
            items:
              basket?.items.map((maping) => {
                return {
                  id: maping.id,
                  quantity: maping.quantity,
                  unitPrice: maping.unitPrice,
                  observations: maping.observations,
                  basketId: maping.basketId,
                  productId: maping.productId,
                  createdAt: maping.createdAt,
                  updatedAt: maping.updatedAt,
                };
              }) ?? [],
            payment: orderFromDatabase.paymentId,
          },
        };
        orderList.push(order);
      }
      return resolve(orderList);
    });
  }

  async updateOrderById(id: string, body: Order): Promise<Order> {
    return new Promise<Order>(async (resolve) => {
      const order = await OrderModel.findOne({
        where: {
          paymentId: id,
        },
      });

      if (!order) {
        throw new Error("Pedido não encontrado.");
      }

      const orderStatus = await OrderStatusModel.findOne({
        where: {
          key: body.status.key
        },
      });

      if (!orderStatus) {
        throw new Error("Status de pedido não encontrado.");
      }

      await order.update(
        { statusId: orderStatus?.id },
        { where: { paymentId: id } }
      );

      const orderUpdated = await OrderModel.findOne({
        where: {
          paymentId: id,
        },
        include: [{ model: OrderStatusModel, as: "status" }],
      });

      resolve({
        uuid: orderUpdated?.uuid,
        code: orderUpdated?.code,
        doneAt: orderUpdated?.doneAt,
        expected: orderUpdated?.expected,
        createdAt: orderUpdated?.createdAt,
        updatedAt: orderUpdated?.updatedAt,
        payment: orderUpdated?.paymentId,
        status: {
          key: orderUpdated?.status?.key as string,
          name: orderUpdated?.status?.name as string,
        },
      });
    });
  }
}
