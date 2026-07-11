process.env.DATABASE_URL = "sqlite://:memory:";

// Clear cached config/db so it re-reads DATABASE_URL
delete require.cache[require.resolve("../src/config")];
delete require.cache[require.resolve("../src/config/db")];

const { sequelize } = require("../src/config/db");

beforeAll(async () => {
  const models = require("../src/models");
  await models.sync({ force: true });
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
