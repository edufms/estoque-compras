const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Category = sequelize.define("Category", {
  nome: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  icone: {
    type: DataTypes.STRING,
    defaultValue: "",
  },
}, {
  tableName: "Categories",
  timestamps: true,
});

module.exports = Category;
