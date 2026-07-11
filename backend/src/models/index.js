const { sequelize } = require("../config/db");
const User = require("./User");
const Product = require("./Product");
const Category = require("./Category");
const ShoppingList = require("./ShoppingList");
const Movement = require("./Movement");
const House = require("./House");
const HouseMember = require("./HouseMember");

User.hasMany(ShoppingList, { foreignKey: "criadoPor", as: "listas" });
ShoppingList.belongsTo(User, { foreignKey: "criadoPor", as: "criador" });

User.hasMany(Movement, { foreignKey: "usuario", as: "movimentos" });
Movement.belongsTo(User, { foreignKey: "usuario", as: "usuarioMov" });

Product.hasMany(Movement, { foreignKey: "produto", as: "movimentos" });
Movement.belongsTo(Product, { foreignKey: "produto", as: "produtoMov" });

House.hasMany(HouseMember, { foreignKey: "houseId", as: "membros" });
HouseMember.belongsTo(House, { foreignKey: "houseId", as: "casa" });

HouseMember.belongsTo(User, { foreignKey: "userId", as: "usuario" });
User.hasMany(HouseMember, { foreignKey: "userId", as: "membrosCasas" });

House.belongsTo(User, { foreignKey: "criadoPor", as: "criador" });
User.hasMany(House, { foreignKey: "criadoPor", as: "casasCriadas" });

House.hasMany(Product, { foreignKey: "houseId", as: "produtos", constraints: false });
House.hasMany(Category, { foreignKey: "houseId", as: "categorias", constraints: false });
House.hasMany(ShoppingList, { foreignKey: "houseId", as: "listas", constraints: false });
House.hasMany(Movement, { foreignKey: "houseId", as: "movimentos", constraints: false });

async function sync(options) {
  await sequelize.sync(options);
}

module.exports = { sequelize, sync, User, Product, Category, ShoppingList, Movement, House, HouseMember };
