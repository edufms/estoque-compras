const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Movement = sequelize.define(
  "Movement",
  {
    produto: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    tipo: {
      type: DataTypes.ENUM("entrada", "saida"),
      allowNull: false,
    },
    quantidade: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: { min: 0 },
    },
    usuario: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    observacao: {
      type: DataTypes.TEXT,
      defaultValue: "",
    },
    validades: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    listaId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    tableName: "Movements",
    timestamps: true,
  },
);

module.exports = Movement;
