const { Router } = require("express");
const asyncHandler = require("express-async-handler");
const { autenticar } = require("../middleware/auth");
const controller = require("../controllers/casa.controller");

const router = Router();

router.get("/", autenticar, asyncHandler(controller.listar));
router.post("/", autenticar, asyncHandler(controller.criar));
router.get("/atual", autenticar, asyncHandler(controller.atual));
router.post("/entrar", autenticar, asyncHandler(controller.entrar));
router.post("/:id/sair", autenticar, asyncHandler(controller.sair));
router.post("/:id/regenerar-codigo", autenticar, asyncHandler(controller.regenerarCodigo));
router.put("/:id", autenticar, asyncHandler(controller.editar));
router.delete("/:id/membros/:userId", autenticar, asyncHandler(controller.removerMembro));
router.delete("/:id", autenticar, asyncHandler(controller.excluir));

module.exports = router;
