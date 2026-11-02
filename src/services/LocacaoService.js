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
}

module.exports = new LocacaoService();
