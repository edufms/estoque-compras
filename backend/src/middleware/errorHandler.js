const { ValidationError, BaseError } = require("sequelize");

function errorHandler(err, req, res, _next) {
  console.error(err.stack);
  let status = err.status || 500;
  let mensagem = err.message || "Erro interno do servidor";

  if (err instanceof ValidationError) {
    status = 400;
    mensagem = err.errors.map((e) => e.message).join("; ");
  } else if (err instanceof BaseError) {
    status = 400;
    mensagem = "Erro no banco de dados";
  }

  res.status(status).json({ erro: mensagem });
}

function naoEncontrado(req, res) {
  res.status(404).json({ erro: "Rota não encontrada" });
}

module.exports = { errorHandler, naoEncontrado };
