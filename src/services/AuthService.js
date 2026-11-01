const bcrypt = require("bcrypt");
const prisma = require("../databases/prisma");
const ApiError = require("../utils/error");
const { gerarToken } = require("../utils/jwt");

class AuthService {
  async login(data) {
    const { email, senha } = data;
    const usuario = await prisma.usuario.findUnique({
      where: { email }
    });
    if (!usuario) {
      throw new ApiError("E-mail ou senha inválidos.", 401);
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) {
      throw new ApiError("E-mail ou senha inválidos.", 401);
    }

    return gerarToken(usuario);
  }
}

module.exports = new AuthService();
