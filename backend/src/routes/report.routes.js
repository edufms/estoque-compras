const express = require("express");
const asyncHandler = require("express-async-handler");
const router = express.Router();
const controller = require("../controllers/report.controller");
const { autenticar } = require("../middleware/auth");

/**
 * @swagger
 * /api/relatorios/estoque-baixo:
 *   get:
 *     summary: Produtos com estoque baixo
 *     tags: [Relatórios]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Produtos }
 */
router.get("/estoque-baixo", autenticar, asyncHandler(controller.estoqueBaixo));

/**
 * @swagger
 * /api/relatorios/valor-total:
 *   get:
 *     summary: Valor total do estoque
 *     tags: [Relatórios]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Valor total }
 */
router.get("/valor-total", autenticar, asyncHandler(controller.valorTotalEstoque));

/**
 * @swagger
 * /api/relatorios/mais-movimentados:
 *   get:
 *     summary: Produtos mais movimentados
 *     tags: [Relatórios]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Ranking }
 */
router.get("/mais-movimentados", autenticar, asyncHandler(controller.maisMovimentados));

/**
 * @swagger
 * /api/relatorios/listas-pendentes:
 *   get:
 *     summary: Listas de compras pendentes
 *     tags: [Relatórios]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Listas }
 */
router.get("/listas-pendentes", autenticar, asyncHandler(controller.listasPendentes));

module.exports = router;
