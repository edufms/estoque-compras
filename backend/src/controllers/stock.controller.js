const { Op } = require("sequelize");
const { Product, Movement, User } = require("../models");
const { mesclarValidades } = require("../utils/validades");

async function entrada(req, res) {
  const { quantidade, observacao } = req.body;
  if (!quantidade || quantidade <= 0) {
    return res.status(400).json({ erro: "quantidade deve ser maior que zero" });
  }
  const produto = await Product.findByPk(req.params.id);
  if (!produto) return res.status(404).json({ erro: "Produto não encontrado" });

  produto.quantidade += Number(quantidade);
  await produto.save();

  const movimento = await Movement.create({
    produto: produto.id,
    tipo: "entrada",
    quantidade: Number(quantidade),
    usuario: req.usuario.id,
    observacao: observacao || "",
  });

  return res.status(201).json({ produto, movimento });
}

async function saida(req, res) {
  const { quantidade, observacao } = req.body;
  if (!quantidade || quantidade <= 0) {
    return res.status(400).json({ erro: "quantidade deve ser maior que zero" });
  }
  const produto = await Product.findByPk(req.params.id);
  if (!produto) return res.status(404).json({ erro: "Produto não encontrado" });

  const qtd = Number(quantidade);
  if (produto.quantidade < qtd) {
    return res.status(400).json({ erro: "Estoque insuficiente" });
  }

  produto.quantidade -= qtd;
  await produto.save();

  const movimento = await Movement.create({
    produto: produto.id,
    tipo: "saida",
    quantidade: qtd,
    usuario: req.usuario.id,
    observacao: observacao || "",
  });

  const alerta = produto.quantidade <= produto.estoqueMinimo;
  return res.status(201).json({ produto, movimento, alertaBaixoEstoque: alerta });
}

async function historico(req, res) {
  const filtro = {};
  if (req.query.produto) filtro.produto = req.query.produto;
  if (req.query.tipo) filtro.tipo = req.query.tipo;

  const options = {
    where: filtro,
    order: [["createdAt", "DESC"]],
  };
  if (req.query.limit) options.limit = Number(req.query.limit);

  const movimentos = await Movement.findAll(options);

  const produtos = {};
  const usuarios = {};
  for (const m of movimentos) {
    if (!produtos[m.produto]) {
      const p = await Product.findByPk(m.produto, { attributes: ["id", "nome"] });
      produtos[m.produto] = p;
    }
    if (!usuarios[m.usuario]) {
      const u = await User.findByPk(m.usuario, { attributes: ["id", "nome", "email"] });
      usuarios[m.usuario] = u;
    }
  }

  const resultado = movimentos.map((m) => {
    const json = m.toJSON();
    json.produto = produtos[m.produto] || { id: m.produto, nome: null };
    json.usuario = usuarios[m.usuario] || { id: m.usuario, nome: null, email: null };
    return json;
  });

  return res.json(resultado);
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

    let produto = await Product.findOne({ where: { nome: { [Op.iLike]: nome } } });
    if (!produto) {
      produto = await Product.create({
        nome,
        categoria,
        preco: valorUnitario,
        quantidade: 0,
        estoqueMinimo: 0,
        validades: [],
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
    });

    importados.push({ nome, produto: produto.id, quantidade });
  }

  return res.status(201).json({ importados: importados.length, itens: importados });
}

module.exports = { entrada, saida, historico, importar };
