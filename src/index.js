require("dotenv/config");
const express = require("express");
const cors = require("cors");
const errorMiddleware = require("./middlewares/errorMiddleware");
const authRouter = require("./routes/authRoutes");
const usuarioRouter = require("./routes/usuarioRoutes");
const veiculoRouter = require("./routes/veiculoRoutes");
const locacaoRouter = require("./routes/locacaoRoutes");

const PORT = process.env.PORT || 3000;

const app = express();
app.use(cors({
  origin: "http://localhost:5173"
}));
app.use(express.json());

app.use(authRouter);
app.use(usuarioRouter);
app.use(veiculoRouter);
app.use(locacaoRouter);

app.use(errorMiddleware);

app.listen(PORT, () => {
  console.log(`Servidor rodando em: http://localhost:${PORT}`);
})
