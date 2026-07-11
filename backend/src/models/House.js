const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");
const crypto = require("crypto");

function gerarCodigo() {
  return crypto.randomBytes(4).toString("hex");
}

const House = sequelize.define(
  "House",
  {
    nome: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "Minha Casa",
    },
    codigo: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      defaultValue: gerarCodigo,
    },
    criadoPor: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "Houses",
    timestamps: true,
  },
);

House.gerarCodigo = gerarCodigo;

module.exports = House;
