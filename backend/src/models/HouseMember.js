const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const HouseMember = sequelize.define(
  "HouseMember",
  {
    houseId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM("owner", "admin", "member"),
      defaultValue: "member",
    },
  },
  {
    tableName: "HouseMembers",
    timestamps: true,
    indexes: [
      { unique: true, fields: ["houseId", "userId"] },
    ],
  },
);

module.exports = HouseMember;
