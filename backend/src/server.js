const { connectDB } = require("./config/db");
const config = require("./config");
const criarApp = require("./app");
const os = require("os");

process.on("unhandledRejection", (reason) => {
  console.error("unhandledRejection:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("uncaughtException:", err);
});

function obterIpLocal() {
  const interfaces = os.networkInterfaces();
  for (const nome of Object.keys(interfaces)) {
    for (const iface of interfaces[nome]) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "localhost";
}

async function start() {
  await connectDB();
  const app = criarApp();
  app.listen(config.port, "0.0.0.0", () => {
    console.log(`Servidor rodando na porta ${config.port} (todas as interfaces)`);
    console.log(`Local:   http://localhost:${config.port}`);
    console.log(`Rede:    http://${obterIpLocal()}:${config.port}`);
    console.log(`Swagger: http://${obterIpLocal()}:${config.port}/api-docs`);
  });
}

if (require.main === module) {
  start().catch((err) => {
    console.error("Falha ao iniciar:", err);
    process.exit(1);
  });
}

module.exports = { start };
