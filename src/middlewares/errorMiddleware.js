const { ZodError } = require("zod");
const ApiError = require("../utils/error");

const formatarDetalhes = (error) => {
  return error.issues.map((e) => ({
    campo: e.path[0],
    message: e.message
  }));
};

const errorMiddleware = (error, req, res, next) => {
  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({ error: error.message });
  }

  if (error instanceof ZodError) {
    return res.status(400).json({
      error: "Erro de validação nos dados enviados.",
      details: formatarDetalhes(error)
    });
  }

  return res.status(500).json({ error: "Erro interno do servidor." });
};

module.exports = errorMiddleware
