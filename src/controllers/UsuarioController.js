const usuarioService = require("../services/UsuarioService");

class UsuarioController {
  async create(req, res) {
    const user = await usuarioService.create(req.body);
    return res.status(201).json(user);
  }
}

module.exports = new UsuarioController();
