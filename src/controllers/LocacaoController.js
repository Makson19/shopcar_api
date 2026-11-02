const locacaoService = require("../services/LocacaoService");

class LocacaoController {
  async create(req, res) {
    const locacao = await locacaoService.create(req.user.id, req.body);
    return res.status(201).json(locacao);
  }
}

module.exports = new LocacaoController();
