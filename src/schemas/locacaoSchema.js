const z = require("zod");

const locacaoCreateSchema = z.object({
  veiculoId: z
    .number("O campo 'veiculoId' é obrigatório.")
    .int("O campo 'veiculoId' deve ser um número inteiro.")
    .positive("O campo 'veiculoId' deve ser um número positivo."),
  dataInicio: z.coerce.date("O campo 'dataInicio' é obrigatório."),
  dataPrevistaDevolucao: z.coerce.date("O campo 'dataPrevistaDevolucao' é obrigatório.")
}).refine((data) => data.dataPrevistaDevolucao > data.dataInicio, {
  message: "A data prevista de devolução deve ser posterior à data de início.",
  path: ["dataPrevistaDevolucao"]
});

module.exports = {
  locacaoCreateSchema,
}
