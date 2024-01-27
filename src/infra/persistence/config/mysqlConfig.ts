import OrderStatusModel from "../models/orderStatusModel";
import OrderModel from "../models/orderModel";
import basketsModel from "../models/basketsModel";
import ItemModel from "../models/itemModel";
import ProductModel from "../models/productsModel";

export default () => {
  // Criação da tabela no banco de dados
  basketsModel.sync();
  ItemModel.sync();
  OrderModel.sync();
  ProductModel.sync();
  OrderStatusModel.sync();
};
