const express = require("express");
const asyncHandler = require("express-async-handler");
const router = express.Router();
const controller = require("../controllers/auth.controller");
const { autenticar } = require("../middleware/auth");

/**
 * @swagger
 * /api/auth/cadastrar:
 *   post:
 *     summary: Cadastra um novo usuário
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome: { type: string }
 *               email: { type: string }
 *               senha: { type: string }
 *               role: { type: string, enum: [admin, usuario] }
 *     responses:
 *       201: { description: Usuário criado }
 */
router.post("/cadastrar", asyncHandler(controller.cadastrar));

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Autentica um usuário e retorna JWT
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string }
 *               senha: { type: string }
 *     responses:
 *       200: { description: Token JWT }
 */
router.post("/login", asyncHandler(controller.login));

/**
 * @swagger
 * /api/auth/perfil:
 *   get:
 *     summary: Retorna dados do usuário autenticado
 *     tags: [Auth]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Perfil }
 */
router.get("/perfil", autenticar, controller.perfil);

module.exports = router;
