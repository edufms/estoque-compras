const { Op } = require("sequelize");
const { Product, Movement } = require("../models");
const { mesclarValidades } = require("../utils/validades");
const { likeOp } = require("../utils/dialect");

async function listar(req, res) {
  const { nome, categoria, limite, offset } = req.query;
  const filtro = { houseId: req.casaId };
  if (nome) filtro.nome = { [likeOp()]: `%${nome}%` };
  if (categoria) filtro.categoria = { [likeOp()]: `%${categoria}%` };
  if (req.usuario.role !== "admin") {
    filtro.criadoPor = { [Op.or]: [req.usuario.id, null] };
  }
  const options = { where: filtro, order: [["nome", "ASC"]] };
  if (limite) options.limit = Number(limite);
  if (offset) options.offset = Number(offset);
  const produtos = await Product.findAll(options);
  return res.json(produtos);
}

async function obter(req, res) {
  const produto = await Product.findOne({ where: { id: req.params.id, houseId: req.casaId } });
  if (!produto) return res.status(404).json({ erro: "Produto não encontrado" });
  return res.json(produto);
}

async function criar(req, res) {
  const { nome, descricao, categoria, preco, quantidade, estoqueMinimo, validades } = req.body;
  if (!nome || !categoria || preco == null) {
    return res.status(400).json({ erro: "nome, categoria e preco são obrigatórios" });
  }
  const existente = await Product.findOne({
    where: { nome: { [likeOp()]: String(nome).trim() }, houseId: req.casaId },
  });
  if (existente) {
    return res.status(409).json({ erro: "Já existe um produto com este nome" });
  }
  const produto = await Product.create({
    nome: String(nome).trim(),
    descricao: descricao || "",
    categoria,
    preco,
    quantidade: quantidade || 0,
    estoqueMinimo: estoqueMinimo || 0,
    validades: Array.isArray(validades) ? validades : [],
    criadoPor: req.usuario.id,
    houseId: req.casaId,
  });
  const qtd = Number(quantidade) || 0;
  if (qtd > 0) {
    await Movement.create({
      produto: produto.id,
      tipo: "entrada",
      quantidade: qtd,
      usuario: req.usuario.id,
      observacao: "Cadastro inicial",
    });
  }
  return res.status(201).json(produto);
}

async function atualizar(req, res) {
  const produto = await Product.findOne({ where: { id: req.params.id, houseId: req.casaId } });
  if (!produto) return res.status(404).json({ erro: "Produto não encontrado" });
  const campos = ["nome", "descricao", "categoria", "preco", "estoqueMinimo", "validades"];
  campos.forEach((c) => {
    if (req.body[c] !== undefined) produto[c] = req.body[c];
  });
  await produto.save();
  return res.json(produto);
}

async function remover(req, res) {
  const produto = await Product.findOne({ where: { id: req.params.id, houseId: req.casaId } });
  if (!produto) return res.status(404).json({ erro: "Produto não encontrado" });
  await produto.destroy();
  return res.json({ mensagem: "Produto removido com sucesso" });
}

async function importar(req, res) {
  const { itens } = req.body;
  if (!Array.isArray(itens) || itens.length === 0) {
    return res.status(400).json({ erro: "itens é obrigatório e não pode ser vazio" });
  }
  const agrupados = {};
  for (const linha of itens) {
    const nome = String(linha.nome || "").trim();
    if (!nome) continue;
    if (!agrupados[nome]) {
      agrupados[nome] = {
        nome,
        categoria: String(linha.categoria || "").trim() || "Geral",
        preco: Number(linha.valorUnitario) || Number(linha.preco) || 0,
        quantidade: 0,
        estoqueMinimo: Number(linha.estoqueMinimo) || 0,
        descricao: String(linha.descricao || "").trim(),
        validades: [],
      };
    }
    const g = agrupados[nome];
    g.quantidade += Number(linha.quantidade) || 0;
    if (linha.validade) {
      g.validades.push({
        data: String(linha.validade).trim(),
        quantidade: Number(linha.quantidade) || 0,
      });
    }
    if (Array.isArray(linha.validades)) {
      for (const v of linha.validades) {
        g.validades.push({ data: v.data, quantidade: Number(v.quantidade) || 0 });
      }
    }
  }
  const criados = [];
  const ignorados = [];
  for (const g of Object.values(agrupados)) {
    const validades = mesclarValidades([], g.validades);
    const existente = await Product.findOne({
      where: { nome: { [likeOp()]: g.nome }, houseId: req.casaId },
    });
    if (existente) {
      ignorados.push({ nome: g.nome, motivo: "Já existe" });
      continue;
    }
    const produto = await Product.create({
      nome: g.nome,
      categoria: g.categoria,
      preco: g.preco,
      quantidade: g.quantidade,
      estoqueMinimo: g.estoqueMinimo,
      descricao: g.descricao,
      validades,
      criadoPor: req.usuario.id,
      houseId: req.casaId,
    });
    if (g.quantidade > 0) {
      await Movement.create({
        produto: produto.id,
        tipo: "entrada",
        quantidade: g.quantidade,
        usuario: req.usuario.id,
        observacao: "Importação CSV",
      });
    }
    criados.push({ nome: g.nome, produto: produto.id });
  }
  return res.status(201).json({
    criados: criados.length,
    ignorados: ignorados.length,
  });
}

module.exports = { listar, obter, criar, atualizar, remover, importar };
