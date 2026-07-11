const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");
const bcrypt = require("bcryptjs");

const User = sequelize.define(
  "User",
  {
    nome: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      set(val) {
        this.setDataValue("email", String(val).toLowerCase().trim());
      },
    },
    senha: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM("admin", "usuario"),
      defaultValue: "usuario",
    },
    foto: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "Users",
    timestamps: true,
    hooks: {
      beforeSave: async (user) => {
        if (user.changed("senha")) {
          const salt = await bcrypt.genSalt(10);
          user.senha = await bcrypt.hash(user.senha, salt);
        }
      },
    },
  },
);

User.prototype.compararSenha = function (senhaInformada) {
  return bcrypt.compare(senhaInformada, this.senha);
};

module.exports = User;
