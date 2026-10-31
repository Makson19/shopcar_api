const z = require("zod");

const usuarioCreateSchema = z.object({
  nome: z.string("O nome não pode ser numérico.").trim().min(3, "Nome muito curto."),
  email: z.string("Campo obrigatório.").trim().email("E-mail inválido."),
  senha: z.string("Campo obrigatório.").min(6, "A senha dever ter no mínimo 6 caracteres.")
});

module.exports = {
  usuarioCreateSchema,
};
