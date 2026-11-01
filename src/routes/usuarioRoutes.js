const express = require("express");
const usuarioController = require("../controllers/UsuarioController");
const validate = require("../middlewares/validate.middleware");
const { usuarioCreateSchema } = require("../schemas/usuarioSchema");

const router = express.Router();

router.post("/usuarios", validate(usuarioCreateSchema), usuarioController.create);
router.get("/usuarios", usuarioController.findMany);
router.get("/usuarios/:id", usuarioController.findById);
router.put("/usuarios/:id", usuarioController.update);
router.delete("/usuarios/:id", usuarioController.delete);

module.exports = router;
