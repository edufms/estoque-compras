const express = require("express");
const asyncHandler = require("express-async-handler");
const router = express.Router();
const controller = require("../controllers/stock.controller");
const { autenticar } = require("../middleware/auth");

/**
 * @swagger
 * /api/estoque/{id}/entrada:
 *   post:
 *     summary: Registra entrada de produto no estoque
 *     tags: [Estoque]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Entrada registrada
 */
router.post("/:id/entrada", autenticar, asyncHandler(controller.entrada));

/**
 * @swagger
 * /api/estoque/{id}/saida:
 *   post:
 *     summary: Registra saída de produto do estoque
 *     tags: [Estoque]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Saída registrada
 */
router.post("/:id/saida", autenticar, asyncHandler(controller.saida));

/**
 * @swagger
 * /api/estoque/historico:
 *   get:
 *     summary: Histórico de movimentações
 *     tags: [Estoque]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Movimentações }
 */
router.get("/historico", autenticar, asyncHandler(controller.historico));

/**
 * @swagger
 * /api/estoque/importar:
 *   post:
 *     summary: Importa produtos em massa via CSV (entrada de estoque)
 *     tags: [Estoque]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Itens importados }
 */
router.post("/importar", autenticar, asyncHandler(controller.importar));

/**
 * @swagger
 * /api/estoque/exportar:
 *   get:
 *     summary: Exporta estoque atual como CSV
 *     tags: [Estoque]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: CSV }
 */
router.get("/exportar", autenticar, asyncHandler(controller.exportar));

module.exports = router;
