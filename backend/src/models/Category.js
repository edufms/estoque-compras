const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Category = sequelize.define(
  "Category",
  {
    nome: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    icone: {
      type: DataTypes.STRING,
      defaultValue: "",
    },
    houseId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    tableName: "Categories",
    timestamps: true,
  },
);

module.exports = Category;
