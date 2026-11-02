const veiculoService = require("../services/VeiculoService");

class VeiculoController {
  async create(req, res) {
    const vehicle = await veiculoService.create(req.body);
    return res.status(201).json(vehicle);
  }

  async findMany(req, res) {
    let { disponivel, page, per } = req.query;
    page ||= 1;
    per ||= 10;
    const vehicles = await veiculoService.findMany(disponivel, page, per);
    return res.status(200).json(vehicles);
  }
}

module.exports = new VeiculoController();
