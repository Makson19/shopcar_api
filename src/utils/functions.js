const diaEmMilissegundos = 24 * 60 * 60 * 1000;

const calcularValorTotal = (dataInicio, dataFim, valorDiaria) => {
  const duracao = dataFim.getTime() - dataInicio.getTime();
  const dias = Math.ceil(duracao / diaEmMilissegundos);
  return valorDiaria.mul(dias);
}

module.exports = {
  calcularValorTotal
};
