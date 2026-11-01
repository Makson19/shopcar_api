const { ZodError } = require("zod");
const ApiError = require("../utils/error");

const errorMiddleware = (error, req, res, next) => {
  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({ error: error.message });
  }

  if (error instanceof ZodError) {
    return res.status(400).json({
      error: 'Erro de validação nos dados enviados.',
      details: error.flatten().fieldErrors
    });
  }

  return res.status(500).json({ error: 'Erro interno do servidor.' });
}

module.exports = errorMiddleware
