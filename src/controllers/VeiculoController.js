const veiculoService = require("../services/VeiculoService");

class VeiculoController {
  async create(req, res) {
    const vehicle = await veiculoService.create(req.body);
    return res.status(201).json(vehicle);
  }

  async findMany(req, res) {
    const disponivel = req.query.disponivel;
    const vehicles = await veiculoService.findMany(disponivel);
    return res.status(200).json(vehicles);
  }
}

module.exports = new VeiculoController();
