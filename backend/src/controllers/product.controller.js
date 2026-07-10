const { Op } = require("sequelize");
const { Product } = require("../models");

async function listar(req, res) {
  const { nome, categoria } = req.query;
  const filtro = {};
  if (nome) filtro.nome = { [Op.iLike]: `%${nome}%` };
  if (categoria) filtro.categoria = { [Op.iLike]: `%${categoria}%` };
  const produtos = await Product.findAll({ where: filtro, order: [["nome", "ASC"]] });
  return res.json(produtos);
}

async function obter(req, res) {
  const produto = await Product.findByPk(req.params.id);
  if (!produto) return res.status(404).json({ erro: "Produto não encontrado" });
  return res.json(produto);
}

async function criar(req, res) {
  const { nome, descricao, categoria, preco, quantidade, estoqueMinimo } = req.body;
  if (!nome || !categoria || preco == null) {
    return res.status(400).json({ erro: "nome, categoria e preco são obrigatórios" });
  }
  const produto = await Product.create({
    nome,
    descricao: descricao || "",
    categoria,
    preco,
    quantidade: quantidade || 0,
    estoqueMinimo: estoqueMinimo || 0,
  });
  return res.status(201).json(produto);
}

async function atualizar(req, res) {
  const produto = await Product.findByPk(req.params.id);
  if (!produto) return res.status(404).json({ erro: "Produto não encontrado" });
  const campos = ["nome", "descricao", "categoria", "preco", "estoqueMinimo"];
  campos.forEach((c) => {
    if (req.body[c] !== undefined) produto[c] = req.body[c];
  });
  await produto.save();
  return res.json(produto);
}

async function remover(req, res) {
  const produto = await Product.findByPk(req.params.id);
  if (!produto) return res.status(404).json({ erro: "Produto não encontrado" });
  await produto.destroy();
  return res.json({ mensagem: "Produto removido com sucesso" });
}

module.exports = { listar, obter, criar, atualizar, remover };
