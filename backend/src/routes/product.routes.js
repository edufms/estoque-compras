const express = require("express");
const asyncHandler = require("express-async-handler");
const router = express.Router();
const controller = require("../controllers/product.controller");
const { autenticar, autorizar } = require("../middleware/auth");

/**
 * @swagger
 * /api/produtos:
 *   get:
 *     summary: Lista produtos (filtros nome, categoria)
 *     tags: [Produtos]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: nome
 *         schema:
 *           type: string
 *       - in: query
 *         name: categoria
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de produtos
 *   post:
 *     summary: Cria um produto
 *     tags: [Produtos]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Criado }
 */
router.get("/", autenticar, asyncHandler(controller.listar));
router.post("/", autenticar, autorizar("admin"), asyncHandler(controller.criar));

/**
 * @swagger
 * /api/produtos/{id}:
 *   get:
 *     summary: Obtém um produto
 *     tags: [Produtos]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Produto
 *   put:
 *     summary: Atualiza um produto
 *     tags: [Produtos]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Atualizado
 *   delete:
 *     summary: Remove um produto
 *     tags: [Produtos]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Removido
 */
router.get("/:id", autenticar, asyncHandler(controller.obter));
router.put("/:id", autenticar, autorizar("admin"), asyncHandler(controller.atualizar));
router.delete("/:id", autenticar, autorizar("admin"), asyncHandler(controller.remover));

module.exports = router;
