const usuarioService = require("../services/UsuarioService");

class UsuarioController {
  async create(req, res) {
    const user = await usuarioService.create(req.body);
    return res.status(201).json(user);
  }

  async findMany(req, res) {
    let { page, per, orderBy, order } = req.query;
    page ||= 1;
    per ||= 10;
    orderBy ||= "id";
    order ||= "desc";

    const usuarios = await usuarioService.findMany(page, per, orderBy, order);
    return res.status(200).json(usuarios);
  }

  async findById(req, res) {
    const { id } = req.params;
    const usuario = await usuarioService.findById(id);
    return res.status(200).json(usuario);
  }
}

module.exports = new UsuarioController();
