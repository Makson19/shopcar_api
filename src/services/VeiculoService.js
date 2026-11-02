const prisma = require("../databases/prisma");
const ApiError = require("../utils/error");

class VeiculoService {
  async create(data) {
    const { placa, valorDiaria } = data;

    if (!Number.isFinite(valorDiaria) || valorDiaria <= 0) {
      throw new ApiError("O valor da diária deve ser um número positivo.", 400);
    }

    const vehicleAlreadyExists = await prisma.veiculo.findUnique({
      where: { placa }
    });

    if (vehicleAlreadyExists) {
      throw new ApiError("Placa já cadastrada no sistema", 400);
    }

    const vehicle = await prisma.veiculo.create({
      data: {
        marca: data.marca.trim(),
        modelo: data.modelo.trim(),
        placa: data.placa.trim().toUpperCase(),
        ano: data.ano,
        valorDiaria,
      },
      select: {
        id: true,
        marca: true,
        modelo: true,
        placa: true,
        ano: true,
        valorDiaria: true,
        disponivel: true
      }
    });
    return vehicle;
  }

  async findMany(disponivel) {
    const isAvailable = disponivel === "true";
    if (disponivel !== "true" && disponivel !== "false") {
      throw new ApiError("O parâmetro 'disponivel' deve ser 'true' ou 'false'.", 400);
    }

    const vehicles = await prisma.veiculo.findMany({
      where: { disponivel: isAvailable },
      orderBy: { id: "desc" }
    });

    return vehicles;
  }
}

module.exports = new VeiculoService();
