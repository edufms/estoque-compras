const { Op } = require("sequelize");
const { sequelize } = require("../config/db");

function likeOp() {
  return sequelize.getDialect() === "postgres" ? Op.iLike : Op.like;
}

module.exports = { likeOp };
