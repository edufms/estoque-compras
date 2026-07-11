const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Product = sequelize.define(
  "Product",
  {
    nome: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    descricao: {
      type: DataTypes.TEXT,
      defaultValue: "",
    },
    categoria: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    preco: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: { min: 0 },
    },
    quantidade: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
      validate: { min: 0 },
    },
    estoqueMinimo: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
      validate: { min: 0 },
    },
    validades: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    criadoPor: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    houseId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    tableName: "Products",
    timestamps: true,
  },
);

Product.prototype.abaixoDoMinimo = function () {
  return this.quantidade <= this.estoqueMinimo;
};

Product.prototype.toJSON = function () {
  const values = { ...this.get() };
  values.abaixoDoMinimo = this.quantidade <= this.estoqueMinimo;
  return values;
};

module.exports = Product;
