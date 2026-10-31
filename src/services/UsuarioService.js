const bcrypt = require("bcryptjs");
const prisma = require("../databases/prisma");
const ApiError = require("../utils/error");

class UsuarioService {
  async create(data) {
    const { nome, email, senha } = data;
    const userAlreadyExists = await prisma.usuario.findUnique({
      where: { email }
    });

    if (userAlreadyExists) {
      throw new ApiError("E-mail já cadastrado no sistema.", 400);
    }

    const hashedPassword = await bcrypt.hash(senha, 10);
    const user = await prisma.usuario.create({
      data: { nome, email, senha: hashedPassword },
      select: { id: true, nome: true, email: true, dataCadastro: true }
    });

    return user;
  }
}

module.exports = new UsuarioService();
