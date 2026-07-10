const { Category } = require("../models");

async function listar(req, res) {
  const categorias = await Category.findAll({ order: [["nome", "ASC"]] });
  return res.json(categorias);
}

async function salvar(req, res) {
  const { nome, icone } = req.body;
  if (!nome || !nome.trim()) {
    return res.status(400).json({ erro: "nome é obrigatório" });
  }
  const [cat] = await Category.upsert({
    nome: nome.trim(),
    icone: icone || "",
  });
  return res.json(cat);
}

async function remover(req, res) {
  const nome = decodeURIComponent(req.params.nome);
  await Category.destroy({ where: { nome } });
  return res.json({ mensagem: "Categoria removida" });
}

module.exports = { listar, salvar, remover };
