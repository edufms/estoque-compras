const { Op } = require("sequelize");
const { Product, Movement, User } = require("../models");
const { mesclarValidades } = require("../utils/validades");
const { likeOp } = require("../utils/dialect");

async function entrada(req, res) {
  const { quantidade, observacao, validades } = req.body;
  if (!quantidade || quantidade <= 0) {
    return res.status(400).json({ erro: "quantidade deve ser maior que zero" });
  }
  const produto = await Product.findOne({ where: { id: req.params.id, houseId: req.casaId } });
  if (!produto) return res.status(404).json({ erro: "Produto não encontrado" });

  produto.quantidade += Number(quantidade);
  if (Array.isArray(validades) && validades.length) {
    produto.validades = mesclarValidades(produto.validades, validades);
  }
  await produto.save();

  const movimento = await Movement.create({
    produto: produto.id,
    tipo: "entrada",
    quantidade: Number(quantidade),
    usuario: req.usuario.id,
    observacao: observacao || "",
    validades: Array.isArray(validades) ? validades : [],
    houseId: req.casaId,
  });

  return res.status(201).json({ produto, movimento });
}

async function saida(req, res) {
  const { quantidade, observacao, validadeData } = req.body;
  if (!quantidade || quantidade <= 0) {
    return res.status(400).json({ erro: "quantidade deve ser maior que zero" });
  }
  const produto = await Product.findOne({ where: { id: req.params.id, houseId: req.casaId } });
  if (!produto) return res.status(404).json({ erro: "Produto não encontrado" });

  const qtd = Number(quantidade);
  if (produto.quantidade < qtd) {
    return res.status(400).json({ erro: "Estoque insuficiente" });
  }

  produto.quantidade -= qtd;
  if (validadeData && Array.isArray(produto.validades)) {
    const lote = produto.validades.find((v) => v.data === validadeData);
    if (lote) {
      if (lote.quantidade < qtd) {
        return res
          .status(400)
          .json({ erro: `Lote ${validadeData} tem apenas ${lote.quantidade} unidade(s)` });
      }
      lote.quantidade -= qtd;
      if (lote.quantidade <= 0) {
        produto.validades = produto.validades.filter((v) => v.data !== validadeData);
      }
      produto.changed("validades", true);
    }
  }
  await produto.save();

  const movimento = await Movement.create({
    produto: produto.id,
    tipo: "saida",
    quantidade: qtd,
    usuario: req.usuario.id,
    observacao: observacao || "",
    houseId: req.casaId,
  });

  const alerta = produto.quantidade <= produto.estoqueMinimo;
  return res.status(201).json({ produto, movimento, alertaBaixoEstoque: alerta });
}

async function historico(req, res) {
  const filtro = { houseId: req.casaId };
  if (req.query.produto) filtro.produto = req.query.produto;
  if (req.query.tipo) filtro.tipo = req.query.tipo;
  if (req.usuario.role !== "admin") filtro.usuario = req.usuario.id;

  const options = {
    where: filtro,
    order: [["createdAt", "DESC"]],
    include: [
      { model: Product, as: "produtoMov", attributes: ["id", "nome"] },
      { model: User, as: "usuarioMov", attributes: ["id", "nome", "email"] },
    ],
  };
  if (req.query.limit) options.limit = Number(req.query.limit);
  if (req.query.offset) options.offset = Number(req.query.offset);

  const movimentos = await Movement.findAll(options);

  return res.json(movimentos);
}

async function importar(req, res) {
  const { itens } = req.body;
  if (!Array.isArray(itens) || itens.length === 0) {
    return res.status(400).json({ erro: "itens é obrigatório e não pode ser vazio" });
  }

  const importados = [];
  for (const linha of itens) {
    const nome = String(linha.nome || "").trim();
    if (!nome) continue;
    const quantidade = Number(linha.quantidade);
    if (!quantidade || quantidade <= 0) continue;
    const categoria = String(linha.categoria || "").trim() || "Geral";
    const valorUnitario = Number(linha.valorUnitario) || 0;
    const validade = linha.validade ? String(linha.validade).trim() : "";

    let produto = await Product.findOne({ where: { nome: { [likeOp()]: nome }, houseId: req.casaId } });
    if (!produto) {
      produto = await Product.create({
        nome,
        categoria,
        preco: valorUnitario,
        quantidade: 0,
        estoqueMinimo: 0,
        validades: [],
        houseId: req.casaId,
      });
    } else {
      produto.categoria = categoria || produto.categoria;
      if (valorUnitario) produto.preco = valorUnitario;
    }

    produto.quantidade += quantidade;
    if (validade) {
      const data = new Date(validade);
      if (!Number.isNaN(data.getTime())) {
        produto.validades = mesclarValidades(produto.validades, [{ data: validade, quantidade }]);
      }
    }
    await produto.save();

    await Movement.create({
      produto: produto.id,
      tipo: "entrada",
      quantidade,
      usuario: req.usuario.id,
      observacao: "Importação CSV",
      houseId: req.casaId,
    });

    importados.push({ nome, produto: produto.id, quantidade });
  }

  return res.status(201).json({ importados: importados.length, itens: importados });
}

async function exportar(req, res) {
  const filtro = { houseId: req.casaId };
  if (req.usuario.role !== "admin") {
    filtro.criadoPor = { [Op.or]: [req.usuario.id, null] };
  }
  const produtos = await Product.findAll({ where: filtro, order: [["nome", "ASC"]] });

  const linhas = ["nome,categoria,preco,quantidade,estoqueMinimo,validade"];
  for (const p of produtos) {
    const preco = (Number(p.preco) || 0).toFixed(2);
    const nome = `"${(p.nome || "").replace(/"/g, '""')}"`;
    const categoria = `"${(p.categoria || "").replace(/"/g, '""')}"`;
    const validade =
      Array.isArray(p.validades) && p.validades.length
        ? `"${p.validades.map((v) => `${v.data}:${v.quantidade}`).join(";")}"`
        : "";
    linhas.push(`${nome},${categoria},${preco},${p.quantidade},${p.estoqueMinimo},${validade}`);
  }

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", "attachment; filename=estoque.csv");
  return res.send(linhas.join("\n"));
}

module.exports = { entrada, saida, historico, importar, exportar };
