const locacaoService = require("../services/LocacaoService");

class LocacaoController {
  async create(req, res) {
    const locacao = await locacaoService.create(req.user.id, req.body);
    return res.status(201).json(locacao);
  }

  async findMany(req, res) {
    let { status, page, per } = req.query;
    page ||= 1;
    per ||= 10;

    const locacoes = await locacaoService.findMany(req.user.id, status, page, per);
    return res.status(200).json(locacoes);
  }
}

module.exports = new LocacaoController();
