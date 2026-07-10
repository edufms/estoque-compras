const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const swaggerDocs = require("./config/swagger");
const { autenticar } = require("./middleware/auth");

const authRoutes = require("./routes/auth.routes");
const productRoutes = require("./routes/product.routes");
const stockRoutes = require("./routes/stock.routes");
const shoppingListRoutes = require("./routes/shoppingList.routes");
const reportRoutes = require("./routes/report.routes");
const categoryRoutes = require("./routes/category.routes");

function criarApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));
  app.get("/health", (req, res) => res.json({ status: "ok" }));

  app.use("/api/auth", authRoutes);
  app.use("/api/produtos", productRoutes);
  app.use("/api/estoque", stockRoutes);
  app.use("/api/listas", shoppingListRoutes);
  app.use("/api/relatorios", reportRoutes);
  app.use("/api/categorias", categoryRoutes);

  app.use((req, res) => res.status(404).json({ erro: "Rota não encontrada" }));
  app.use((err, req, res, next) => {
    console.error(err.stack);
    const status = err.status || 500;
    res.status(status).json({ erro: err.message || "Erro interno" });
  });

  return app;
}

module.exports = criarApp;
