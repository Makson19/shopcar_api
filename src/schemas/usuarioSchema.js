const z = require("zod");

const usuarioCreateSchema = z.object({
  nome: z.string("Nome obrigatório.").trim().min(3, "Nome muito curto."),
  email: z.string("E-mail obrigatório.").trim().email("E-mail inválido."),
  senha: z.string("Senha obrigatória.").min(6, "A senha dever ter no mínimo 6 caracteres.")
});

module.exports = {
  usuarioCreateSchema,
};
