const express = require("express");
const veiculoController = require("../controllers/VeiculoController");
const { veiculoCreateSchema } = require("../schemas/veiculoSchema");
const validateSchema = require("../middlewares/validateMiddleware");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/veiculos", authMiddleware, validateSchema(veiculoCreateSchema), veiculoController.create);
router.get("/veiculos", authMiddleware, veiculoController.findMany);

module.exports = router;
