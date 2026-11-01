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

    const users = await usuarioService.findMany(page, per, orderBy, order);
    return res.status(200).json(users);
  }

  async findById(req, res) {
    const { id } = req.params;
    const user = await usuarioService.findById(id);
    return res.status(200).json(user);
  }

  async update(req, res) {
    const { id } = req.params;
    const user = await usuarioService.update(id, req.body);
    return res.status(200).json(user);
  }

  async delete(req, res) {
    const { id } = req.params;
    await usuarioService.delete(id);
    return res.status(204).send();
  }
}

module.exports = new UsuarioController();
