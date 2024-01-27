// index.js
import sequelize from "../database/connection";
import basketsModel from "./basketsModel";
import itensModel from "./itemModel";
import productsModel from "./productsModel";

// Relacionamento entre as models
basketsModel.hasMany(itensModel, { as: "items", onDelete: "cascade" });
itensModel.belongsTo(basketsModel);
productsModel.hasMany(itensModel, { onDelete: "cascade" });
// Sincronizando o modelo com o banco de dados
sequelize.sync().then(() => {
  console.log("Models synchronized with database");
});
