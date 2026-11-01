const express = require("express");
const usuarioController = require("../controllers/UsuarioController");
const authMiddleware = require("../middlewares/authMiddleware");
const validate = require("../middlewares/validateMiddleware");
const { usuarioCreateSchema, usuarioUpdateSchema } = require("../schemas/usuarioSchema");

const router = express.Router();

router.post("/usuarios", validate(usuarioCreateSchema), usuarioController.create);
router.get("/usuarios", authMiddleware, usuarioController.findMany);
router.get("/usuarios/:id", authMiddleware, usuarioController.findById);
router.put("/usuarios/:id", authMiddleware, validate(usuarioUpdateSchema), usuarioController.update);
router.delete("/usuarios/:id", authMiddleware, usuarioController.delete);

module.exports = router;
