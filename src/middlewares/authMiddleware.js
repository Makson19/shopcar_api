const { validarToken } = require("../utils/jwt");

const authMiddleware = (req, res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization) {
    return res.status(401).json({ error: "Token não informado." });
  }

  const [tipo, token, extra] = authorization.split(" ");
  if (tipo !== "Bearer" || !token || extra) {
    return res.status(401).json({ error: "Token inválido." });
  }

  try {
    const payload = validarToken(token);
    req.user = {
      id: payload.id,
      nome: payload.nome,
      email: payload.email
    };
    next();
  } catch (e) {
    return res.status(401).json({ error: "Token inválido ou expirado." });
  }
}

module.exports = authMiddleware;
