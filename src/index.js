require("dotenv/config");
const express = require("express");
const errorMiddleware = require("./middlewares/errorMiddleware");
const authRouter = require("./routes/authRoutes");
const usuarioRouter = require("./routes/usuarioRoutes");
const veiculoRouter = require("./routes/veiculoRoutes");

const PORT = process.env.PORT;

const app = express();
app.use(express.json());

app.use(authRouter);
app.use(usuarioRouter);
app.use(veiculoRouter);

app.use(errorMiddleware);

app.listen(PORT, () => {
  console.log(`Servidor rodando em: http://localhost:${PORT}`);
})
