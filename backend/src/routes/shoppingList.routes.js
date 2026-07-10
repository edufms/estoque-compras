const express = require("express");
const asyncHandler = require("express-async-handler");
const router = express.Router();
const controller = require("../controllers/shoppingList.controller");
const { autenticar } = require("../middleware/auth");

/**
 * @swagger
 * /api/listas/automatica:
 *   post:
 *     summary: Cria lista automática para produtos abaixo do mínimo
 *     tags: [Listas de Compras]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Lista criada }
 */
router.post("/automatica", autenticar, asyncHandler(controller.criarAutomatica));

/**
 * @swagger
 * /api/listas/manual:
 *   post:
 *     summary: Cria lista de compras manual
 *     tags: [Listas de Compras]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Lista criada }
 */
router.post("/manual", autenticar, asyncHandler(controller.criarManual));

/**
 * @swagger
 * /api/listas:
 *   get:
 *     summary: Lista todas as listas (filtro status)
 *     tags: [Listas de Compras]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Listas }
 */
router.get("/", autenticar, asyncHandler(controller.listar));

/**
 * @swagger
 * /api/listas/{id}:
 *   get:
 *     summary: Obtém uma lista
 *     tags: [Listas de Compras]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista
 *   delete:
 *     summary: Remove uma lista
 *     tags: [Listas de Compras]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Removida
 */
router.get("/:id", autenticar, asyncHandler(controller.obter));
router.put("/:id", autenticar, asyncHandler(controller.atualizar));
router.delete("/:id", autenticar, asyncHandler(controller.remover));

/**
 * @swagger
 * /api/listas/{id}/marcar:
 *   post:
 *     summary: Marca item como comprado
 *     tags: [Listas de Compras]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Atualizada }
 */
router.post("/:id/marcar", autenticar, asyncHandler(controller.marcarComprado));

/**
 * @swagger
 * /api/listas/{id}/finalizar:
 *   post:
 *     summary: Finaliza lista e atualiza o estoque
 *     tags: [Listas de Compras]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Finalizada }
 */
router.post("/:id/finalizar", autenticar, asyncHandler(controller.finalizar));
router.post("/:id/reabrir", autenticar, asyncHandler(controller.reabrir));

module.exports = router;
