const express = require("express");
const asyncHandler = require("express-async-handler");
const router = express.Router();
const controller = require("../controllers/category.controller");
const { autenticar } = require("../middleware/auth");

router.get("/", autenticar, asyncHandler(controller.listar));
router.post("/", autenticar, asyncHandler(controller.salvar));
router.delete("/:nome", autenticar, asyncHandler(controller.remover));

module.exports = router;
