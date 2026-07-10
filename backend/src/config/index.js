require("dotenv").config();

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  console.warn("[config] AVISO: JWT_SECRET não definido. Usando segredo temporário (tokens inválidos após reinício).");
}

module.exports = {
  port: process.env.PORT || 3000,
  databaseUrl: process.env.DATABASE_URL || "postgresql://estoque:estoque123@localhost:5432/estoque-compras",
  jwtSecret: jwtSecret || "segredo-temporario-nao-usar-em-producao",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "24h",
};
