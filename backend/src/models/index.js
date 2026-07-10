const { sequelize } = require("../config/db");
const User = require("./User");
const Product = require("./Product");
const Category = require("./Category");
const ShoppingList = require("./ShoppingList");
const Movement = require("./Movement");

User.hasMany(ShoppingList, { foreignKey: "criadoPor", as: "listas" });
ShoppingList.belongsTo(User, { foreignKey: "criadoPor", as: "criador" });

User.hasMany(Movement, { foreignKey: "usuario", as: "movimentos" });
Movement.belongsTo(User, { foreignKey: "usuario", as: "usuarioMov" });

Product.hasMany(Movement, { foreignKey: "produto", as: "movimentos" });
Movement.belongsTo(Product, { foreignKey: "produto", as: "produtoMov" });

async function sync(options) {
  await sequelize.sync(options);
}

module.exports = { sequelize, sync, User, Product, Category, ShoppingList, Movement };
