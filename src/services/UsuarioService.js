const bcrypt = require("bcrypt");
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

  async findMany(page, per, orderBy, order) {
    if (order !== "asc" && order !== "desc") {
      throw new ApiError("O parâmetro 'order' deve ser 'asc' ou 'desc'.", 400);
    }

    const newPer = Number(per);
    const currentPage = Number(page);
    const [usuarios, total] = await Promise.all([
      prisma.usuario.findMany({
        select: { id: true, nome: true, email: true },
        skip: (currentPage - 1),
        take: newPer,
        orderBy: {
          [orderBy]: order
        }
      }),
      prisma.usuario.count()
    ]);

    const totalOfPages = Math.ceil(total / per);
    const pagination = {
      page: currentPage,
      per: newPer,
      total,
      totalOfPages
    };

    return { data: usuarios, pagination }
  }

  async findById(id) {
    const usuario = await prisma.usuario.findUnique({
      where: { id: Number(id) },
      select: { id: true, nome: true, email: true }
    });

    if (!usuario) {
      throw new ApiError("Usuário não encontrado.", 404);
    }

    return usuario;
  }

  async update(id, data) {
    const { nome, email } = data;
    if (!nome && !email) {
      throw new ApiError("Informe ao menos um campo para atualizar.", 400);
    }

    const userAlreadyExists = await prisma.usuario.findUnique({
      where: { id: Number(id) }
    });
    if (!userAlreadyExists) {
      throw new ApiError("Usuário não encontrado.", 404);
    }

    if (email) {
      const emailAlreadyExists = await prisma.usuario.findUnique({
        where: { email }
      });

      if (emailAlreadyExists) {
        throw new ApiError("E-mail já em uso.", 400);
      }

      const userUpdated = await prisma.usuario.update({
        where: { id: Number(id) },
        data,
        select: { id: true, nome: true, email: true }
      });
      return userUpdated
    }
  }

  async delete(id) {
    const userAlreadyExists = await prisma.usuario.findUnique({
      where: { id: Number(id) }
    });

    if (!userAlreadyExists) {
      throw new ApiError("Usuário não encontrado.", 404);
    }

    return await prisma.usuario.delete({ where: { id: Number(id) } });
  }
}

module.exports = new UsuarioService();
