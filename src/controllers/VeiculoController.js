const veiculoService = require("../services/VeiculoService");

class VeiculoController {
  async create(req, res) {
    const vehicle = await veiculoService.create(req.body);
    return res.status(201).json(vehicle);
  }
}

module.exports = new VeiculoController();
