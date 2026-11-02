const express = require("express");
const locacaoController = require("../controllers/LocacaoController");
const authMiddleware = require("../middlewares/authMiddleware");
const validate = require("../middlewares/validateMiddleware");
const { locacaoCreateSchema } = require("../schemas/locacaoSchema");

const router = express.Router();

router.post("/locacoes", authMiddleware, validate(locacaoCreateSchema), locacaoController.create);
router.get("/locacoes", authMiddleware, locacaoController.findMany);

module.exports = router;
