const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const ShoppingList = sequelize.define(
  "ShoppingList",
  {
    nome: {
      type: DataTypes.STRING,
      defaultValue: "Lista de Compras",
    },
    itens: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    status: {
      type: DataTypes.ENUM("pendente", "finalizada"),
      defaultValue: "pendente",
    },
    criadoPor: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    houseId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    finalizadaEm: {
      type: DataTypes.DATE,
      defaultValue: null,
    },
  },
  {
    tableName: "ShoppingLists",
    timestamps: true,
  },
);

module.exports = ShoppingList;
