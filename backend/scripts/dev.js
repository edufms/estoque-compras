const { start } = require("../src/server");

start().catch((err) => {
  console.error("Erro ao iniciar:", err);
  process.exit(1);
});
