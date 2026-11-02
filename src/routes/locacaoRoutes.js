const express = require("express");
const locacaoController = require("../controllers/LocacaoController");
const authMiddleware = require("../middlewares/authMiddleware");
const validate = require("../middlewares/validateMiddleware");
const { locacaoCreateSchema } = require("../schemas/locacaoSchema");

const router = express.Router();

router.post("/locacoes", authMiddleware, validate(locacaoCreateSchema), locacaoController.create);
router.get("/locacoes", authMiddleware, locacaoController.findMany);
router.get("/locacoes/:id", authMiddleware, locacaoController.findById);
router.patch("/locacoes/:id/finalizar", authMiddleware, locacaoController.finish);

module.exports = router;
