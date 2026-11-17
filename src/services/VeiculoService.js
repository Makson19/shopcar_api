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

  async findMany(disponivel, page, per) {
    const isAvailable = disponivel === "true";
    const newPer = Number(per);
    const currentPage = Number(page);

    if (disponivel && disponivel !== "true" && disponivel !== "false") {
      throw new ApiError("O parâmetro 'disponivel' deve ser 'true' ou 'false'.", 400);
    }

    const [veiculos, total] = await Promise.all([
      prisma.veiculo.findMany({
        where: disponivel ? { disponivel: isAvailable } : {},
        orderBy: { id: "desc" },
        skip: (currentPage - 1) * newPer,
        take: newPer,
      }),
      prisma.veiculo.count({ where: disponivel ? { disponivel: isAvailable } : {} })
    ]);

    const totalOfPages = Math.ceil(total / per);
    const pagination = {
      page: currentPage,
      per: newPer,
      total,
      totalOfPages,
    };

    return { data: veiculos, pagination };
  }
}

module.exports = new VeiculoService();
