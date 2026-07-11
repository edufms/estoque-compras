process.env.DATABASE_URL = "sqlite://:memory:";

delete require.cache[require.resolve("../src/config")];
delete require.cache[require.resolve("../src/config/db")];

const { sequelize } = require("../src/config/db");

beforeAll(async () => {
  const models = require("../src/models");
  await models.sync({ force: true });
});

afterEach(async () => {
  const order = ["Movement", "ShoppingList", "Product", "Category", "HouseMember", "House", "User"];
  for (const name of order) {
    const model = sequelize.models[name];
    if (model) await model.destroy({ where: {} });
  }
});

afterAll(async () => {
  await sequelize.close();
});
