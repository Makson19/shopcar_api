const { StatusLocacao } = require("@prisma/client");
const prisma = require("../databases/prisma");
const ApiError = require("../utils/error");
const { calcularValorTotal } = require("../utils/functions");

class LocacaoService {
  async create(usuarioId, data) {
    const dataInicio = new Date(data.dataInicio);
    const dataPrevistaDevolucao = new Date(data.dataPrevistaDevolucao);

    if (Number.isNaN(dataInicio.getTime()) || Number.isNaN(dataPrevistaDevolucao.getTime())) {
      throw new ApiError("Informe datas válidas.", 400);
    }

    if (dataPrevistaDevolucao <= dataInicio) {
      throw new ApiError("A data prevista de devolução deve ser posterior à data de início.", 400);
    }

    const locacao = await prisma.$transaction(async (tx) => {
      const veiculo = await tx.veiculo.findUnique({
        where: { id: data.veiculoId }
      });

      if (!veiculo) {
        throw new ApiError("Veículo não encontrado.", 404);
      }

      const reservarVeiculo = await tx.veiculo.updateMany({
        where: { id: data.veiculoId, disponivel: true },
        data: { disponivel: false }
      });

      if (reservarVeiculo.count === 0) {
        throw new ApiError("Veículo indisponível para locação.", 409);
      }

      const valorTotal = calcularValorTotal(dataInicio, dataPrevistaDevolucao, veiculo.valorDiaria);

      return await tx.locacao.create({
        data: {
          usuarioId,
          veiculoId: data.veiculoId,
          dataInicio,
          dataPrevistaDevolucao,
          valorTotal,
          status: StatusLocacao.ATIVA
        },
        select: {
          id: true,
          usuarioId: true,
          veiculoId: true,
          dataInicio: true,
          dataPrevistaDevolucao: true,
          valorTotal: true,
          status: true,
          veiculo: {
            select: {
              id: true,
              marca: true,
              modelo: true,
              placa: true,
              ano: true,
              valorDiaria: true
            }
          }
        }
      });
    });

    return locacao;
  }

  async findMany(usuarioId, status, page, per) {
    if (status && status !== "ativa" && status !== "finalizada") {
      throw new ApiError("O parâmetro 'status' deve ser 'ativa' ou 'finalizada'.", 400);
    }

    const currentPage = Number(page);
    const perPage = Number(per);

    if (!Number.isInteger(currentPage) || currentPage < 1) {
      throw new ApiError("O parâmetro 'page' deve ser um número inteiro positivo.", 400);
    }

    if (!Number.isInteger(perPage) || perPage < 1) {
      throw new ApiError("O parâmetro 'per' deve ser um número inteiro positivo.", 400);
    }

    const where = { usuarioId, ...(status && { status: status.toUpperCase() }) };

    const [locacoes, total] = await Promise.all([
      prisma.locacao.findMany({
        where,
        orderBy: { id: "desc" },
        skip: (currentPage - 1) * perPage,
        take: perPage,
        select: {
          id: true,
          usuarioId: true,
          veiculoId: true,
          dataInicio: true,
          dataPrevistaDevolucao: true,
          valorTotal: true,
          status: true,
          veiculo: {
            select: {
              id: true,
              marca: true,
              modelo: true,
              placa: true,
              ano: true,
              valorDiaria: true
            }
          }
        }
      }),
      prisma.locacao.count({ where })
    ]);

    return {
      data: locacoes,
      pagination: {
        page: currentPage,
        per: perPage,
        total,
        totalOfPages: Math.ceil(total / perPage)
      }
    }
  }

  async findById(id, usuarioId) {
    const locacaoId = Number(id);
    if (!Number.isInteger(locacaoId) || locacaoId <= 0) {
      throw new ApiError("O parâmetro 'id' deve ser um número inteiro positivo.", 400);
    }

    const locacao = await prisma.locacao.findFirst({
      where: { id: locacaoId, usuarioId },
      select: {
          id: true,
          usuarioId: true,
          veiculoId: true,
          dataInicio: true,
          dataPrevistaDevolucao: true,
          valorTotal: true,
          status: true,
          veiculo: {
            select: {
              id: true,
              marca: true,
              modelo: true,
              placa: true,
              ano: true,
              valorDiaria: true
            }
          }
        }
    });

    if (!locacao) {
      throw new ApiError("Locação não encontrada.", 404);
    }

    return locacao;
  }

  async finish(id, usuarioId) {
    const locacaoId = Number(id);
    if (!Number.isInteger(locacaoId) || locacaoId <= 0) {
      throw new ApiError("O parâmetro 'id' deve ser um número inteiro positivo.", 400);
    }

    const locacao = await prisma.$transaction(async (tx) => {
      const locacaoExistente = await tx.locacao.findUnique({
        where: { id: locacaoId }
      });

      if (!locacaoExistente || locacaoExistente.usuarioId !== usuarioId) {
        throw new ApiError("Locação não encontrada.", 404);
      }

      if (locacaoExistente.status === StatusLocacao.FINALIZADA) {
        throw new ApiError("Locação já finalizada.", 409);
      }

      const locacaoFinalizada = await tx.locacao.updateMany({
        where: { id: locacaoId, usuarioId, status: StatusLocacao.ATIVA },
        data: { status: StatusLocacao.FINALIZADA, dataDevolucao: new Date() }
      });

      if (locacaoFinalizada.count === 0) {
        throw new ApiError("Locação já finalizada.", 409);
      }

      await tx.veiculo.update({
        where: { id: locacaoExistente.veiculoId },
        data: { disponivel: true }
      });

      return await tx.locacao.findUnique({
        where: { id: locacaoId },
        select: {
          id: true,
          usuarioId: true,
          veiculoId: true,
          dataInicio: true,
          dataPrevistaDevolucao: true,
          valorTotal: true,
          status: true,
          veiculo: {
            select: {
              id: true,
              marca: true,
              modelo: true,
              placa: true,
              ano: true,
              valorDiaria: true
            }
          }
        }
      });
    });

    return locacao;
  }
}

module.exports = new LocacaoService();
