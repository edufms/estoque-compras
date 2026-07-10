const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Controle de Estoque e Lista de Compras",
      version: "1.0.0",
      description: "API de MVP para controle de estoque e listas de compras",
    },
    servers: [{ url: "http://localhost:3000/api" }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ["./src/routes/*.js"],
};

module.exports = swaggerJsdoc(options);
