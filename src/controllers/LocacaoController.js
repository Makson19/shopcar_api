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

  async findById(req, res) {
    const { id } = req.params;
    const locacao = await locacaoService.findById(id, req.user.id);
    return res.status(200).json(locacao);
  }

  async finish(req, res) {
    const { id } = req.params;
    const locacao = await locacaoService.finish(id, req.user.id);
    return res.status(200).json(locacao);
  }
}

module.exports = new LocacaoController();
