const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const swaggerUi = require("swagger-ui-express");
const swaggerDocs = require("./config/swagger");
const { autenticar } = require("./middleware/auth");
const { errorHandler, naoEncontrado } = require("./middleware/errorHandler");

const authRoutes = require("./routes/auth.routes");
const productRoutes = require("./routes/product.routes");
const stockRoutes = require("./routes/stock.routes");
const shoppingListRoutes = require("./routes/shoppingList.routes");
const reportRoutes = require("./routes/report.routes");
const categoryRoutes = require("./routes/category.routes");

function criarApp() {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173", credentials: true }));
  app.use(express.json());

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { erro: "Muitas tentativas. Tente novamente em 15 minutos." },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use("/api/auth", authLimiter);

  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));
  app.get("/health", (req, res) => res.json({ status: "ok" }));

  app.use("/api/auth", authRoutes);
  app.use("/api/produtos", productRoutes);
  app.use("/api/estoque", stockRoutes);
  app.use("/api/listas", shoppingListRoutes);
  app.use("/api/relatorios", reportRoutes);
  app.use("/api/categorias", categoryRoutes);

  app.use(naoEncontrado);
  app.use(errorHandler);

  return app;
}

module.exports = criarApp;
