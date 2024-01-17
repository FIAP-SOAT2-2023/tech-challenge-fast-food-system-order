
import OrderStatusModel from "../models/orderStatusModel";
import OrderModel from "../models/orderModel";
import basketsModel from "../models/basketsModel";
import ItemModel from "../models/itemModel";

export default () => {
  // Criação da tabela no banco de dados
  basketsModel.sync();
  ItemModel.sync();
  OrderModel.sync();
  OrderStatusModel.sync();
};
