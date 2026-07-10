const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const { sequelize } = require("../src/config/db");

beforeAll(async () => {
  await sequelize.authenticate();
  await sequelize.sync({ force: true });
});

afterEach(async () => {
  const tables = Object.values(sequelize.models);
  for (const model of tables) {
    await model.destroy({ where: {}, truncate: { cascade: true } });
  }
});

afterAll(async () => {
  await sequelize.close();
});
