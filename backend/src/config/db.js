const { Sequelize } = require("sequelize");
const config = require("./index");

const isPostgres = config.databaseUrl.startsWith("postgres");

const sequelize = isPostgres
  ? new Sequelize(config.databaseUrl, {
      dialect: "postgres",
      logging: false,
      define: { underscored: false, freezeTableName: true },
    })
  : new Sequelize({
      dialect: "sqlite",
      storage: "./data.sqlite",
      logging: false,
      define: { underscored: false, freezeTableName: true },
    });

async function connectDB() {
  await sequelize.authenticate();
  console.log(`Banco conectado (${isPostgres ? "PostgreSQL" : "SQLite"})`);
  const models = require("../models");
  await models.sync({ alter: false });
  return sequelize;
}

async function disconnectDB() {
  await sequelize.close();
}

module.exports = { sequelize, connectDB, disconnectDB };
