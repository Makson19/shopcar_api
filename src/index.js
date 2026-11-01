require("dotenv/config");
const express = require("express");
const errorMiddleware = require("./middlewares/errorMiddleware");
const usuarioRouter = require("./routes/usuarioRoutes");

const PORT = process.env.PORT;

const app = express();
app.use(express.json());

app.use(usuarioRouter);

app.use(errorMiddleware);

app.listen(PORT, () => {
  console.log(`Servidor rodando em: http://localhost:${PORT}`);
})
