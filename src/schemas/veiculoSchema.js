const z = require('zod');

const veiculoCreateSchema = z.object({
  marca: z.string("O campo 'marca' é obrigatório."),
  modelo: z.string("O campo 'modelo' é obrigatório."),
  placa: z.string("O campo 'placa' é obrigatório."),
  ano: z.number("O campo 'ano' é obrigatório.").int("O campo 'ano' deve ser um número inteiro."),
  valorDiaria: z.number("O campo 'valorDiaria' é obrigatório.").positive("O campo 'valorDiaria' deve ser um número positivo.")
});

module.exports = {
  veiculoCreateSchema,
};
