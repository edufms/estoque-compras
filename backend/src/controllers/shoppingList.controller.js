const { Op } = require("sequelize");
const { Product, ShoppingList, Movement, User } = require("../models");
const { normalizarValidades, mesclarValidades, subtrairValidades } = require("../utils/validades");

async function criarAutomatica(req, res) {
  const produtos = await Product.findAll({});
  const itensBaixo = produtos.filter((p) => p.quantidade <= p.estoqueMinimo);

  const itens = itensBaixo.map((p) => ({
    produto: p.id,
    quantidade: Math.max(p.estoqueMinimo - p.quantidade, 1),
  }));

  if (itens.length === 0) {
    return res.status(200).json({ mensagem: "Nenhum produto abaixo do mínimo", lista: null });
  }

  const lista = await ShoppingList.create({
    nome: "Reposição Automática",
    itens,
    criadoPor: req.usuario.id,
  });

  const itensPopulados = await Promise.all(
    lista.itens.map(async (item) => {
      const p = await Product.findByPk(item.produto, { attributes: ["id", "nome", "categoria"] });
      return { ...item, produto: p || item.produto };
    })
  );
  lista.itens = itensPopulados;
  return res.status(201).json(lista);
}

async function resolverProduto(item) {
  if (item.produto) {
    const existente = await Product.findByPk(item.produto);
    if (existente) return existente;
  }
  if (item.nome) {
    const nomeNormalizado = String(item.nome).trim();
    const existente = await Product.findOne({ where: { nome: { [Op.iLike]: nomeNormalizado } } });
    if (existente) return existente;
    return Product.create({
      nome: nomeNormalizado,
      categoria: (item.categoria && String(item.categoria).trim()) || "Geral",
      preco: Number(item.precoUnitario) || 0,
      quantidade: 0,
      estoqueMinimo: 0,
    });
  }
  return null;
}

async function criarManual(req, res) {
  const { nome, itens } = req.body;
  if (!Array.isArray(itens) || itens.length === 0) {
    return res.status(400).json({ erro: "itens é obrigatório e não pode ser vazio" });
  }
  const itensResolvidos = [];
  for (const item of itens) {
    if (!item.quantidade || item.quantidade <= 0) {
      return res.status(400).json({ erro: "Cada item precisa de quantidade válida" });
    }
    if (!item.produto && !item.nome) {
      return res.status(400).json({ erro: "Cada item precisa de produto ou nome" });
    }
    const produto = await resolverProduto(item);
    if (!produto) {
      return res.status(400).json({ erro: "Não foi possível resolver o produto do item" });
    }
    itensResolvidos.push({
      produto: produto.id,
      quantidade: Number(item.quantidade),
      validades: normalizarValidades(item.validades),
    });
  }
  const lista = await ShoppingList.create({
    nome: nome || "Lista de Compras",
    itens: itensResolvidos,
    criadoPor: req.usuario.id,
  });

  const itensPopulados = await Promise.all(
    lista.itens.map(async (item) => {
      const p = await Product.findByPk(item.produto, { attributes: ["id", "nome", "categoria"] });
      return { ...item, produto: p || item.produto };
    })
  );
  lista.itens = itensPopulados;
  return res.status(201).json(lista);
}

async function listar(req, res) {
  const { status } = req.query;
  const filtro = {};
  if (status) filtro.status = status;
  const listas = await ShoppingList.findAll({
    where: filtro,
    order: [["createdAt", "DESC"]],
  });

  for (const lista of listas) {
    if (Array.isArray(lista.itens)) {
      const itemsPopulados = await Promise.all(
        lista.itens.map(async (item) => {
          const p = await Product.findByPk(item.produto, { attributes: ["id", "nome", "categoria", "preco"] });
          return { ...item, produto: p || item.produto };
        })
      );
      lista.itens = itemsPopulados;
    }
    const criador = await User.findByPk(lista.criadoPor, { attributes: ["id", "nome"] });
    lista.dataValues.criadoPor = criador || lista.criadoPor;
  }

  return res.json(listas);
}

async function obter(req, res) {
  const lista = await ShoppingList.findByPk(req.params.id);
  if (!lista) return res.status(404).json({ erro: "Lista não encontrada" });

  if (Array.isArray(lista.itens)) {
    const itemsPopulados = await Promise.all(
      lista.itens.map(async (item) => {
        const p = await Product.findByPk(item.produto, { attributes: ["id", "nome", "categoria", "preco"] });
        return { ...item, produto: p || item.produto };
      })
    );
    lista.itens = itemsPopulados;
  }
  const criador = await User.findByPk(lista.criadoPor, { attributes: ["id", "nome"] });
  lista.dataValues.criadoPor = criador || lista.criadoPor;

  return res.json(lista);
}

async function marcarComprado(req, res) {
  const { produtoId, comprado } = req.body;
  const lista = await ShoppingList.findByPk(req.params.id);
  if (!lista) return res.status(404).json({ erro: "Lista não encontrada" });
  const item = lista.itens.find((i) => String(i.produto) === String(produtoId));
  if (!item) return res.status(404).json({ erro: "Item não encontrado na lista" });
  item.comprado = comprado !== undefined ? comprado : true;
  await lista.save();
  return res.json(lista);
}

async function finalizar(req, res) {
  const lista = await ShoppingList.findByPk(req.params.id);
  if (!lista) return res.status(404).json({ erro: "Lista não encontrada" });
  if (lista.status === "finalizada") {
    return res.status(400).json({ erro: "Lista já finalizada" });
  }

  for (const item of lista.itens) {
    const produto = await Product.findByPk(item.produto);
    if (!produto) continue;
    produto.quantidade += Number(item.quantidade);
    if (Array.isArray(item.validades) && item.validades.length) {
      produto.validades = mesclarValidades(produto.validades, item.validades);
    }
    await produto.save();
    await Movement.create({
      produto: produto.id,
      tipo: "entrada",
      quantidade: Number(item.quantidade),
      usuario: req.usuario.id,
      observacao: `Compra via lista ${lista.id}`,
      validades: normalizarValidades(item.validades),
    });
  }

  lista.status = "finalizada";
  lista.finalizadaEm = new Date();
  await lista.save();

  const itensPopulados = await Promise.all(
    lista.itens.map(async (item) => {
      const p = await Product.findByPk(item.produto, { attributes: ["id", "nome"] });
      return { ...item, produto: p || item.produto };
    })
  );
  lista.itens = itensPopulados;
  return res.json(lista);
}

async function reabrir(req, res) {
  const lista = await ShoppingList.findByPk(req.params.id);
  if (!lista) return res.status(404).json({ erro: "Lista não encontrada" });
  if (lista.status !== "finalizada") {
    return res.status(400).json({ erro: "Apenas listas finalizadas podem ser reabertas" });
  }

  const movimentos = await Movement.findAll({ where: { observacao: `Compra via lista ${lista.id}` } });
  for (const m of movimentos) {
    const produto = await Product.findByPk(m.produto);
    if (produto) {
      produto.quantidade = Math.max(0, produto.quantidade - Number(m.quantidade));
      if (Array.isArray(m.validades) && m.validades.length) {
        produto.validades = subtrairValidades(produto.validades, m.validades);
      }
      await produto.save();
    }
    await m.destroy();
  }

  lista.status = "pendente";
  lista.finalizadaEm = null;
  await lista.save();

  const itensPopulados = await Promise.all(
    lista.itens.map(async (item) => {
      const p = await Product.findByPk(item.produto, { attributes: ["id", "nome", "categoria", "preco"] });
      return { ...item, produto: p || item.produto };
    })
  );
  lista.itens = itensPopulados;
  return res.json(lista);
}

async function atualizar(req, res) {
  const lista = await ShoppingList.findByPk(req.params.id);
  if (!lista) return res.status(404).json({ erro: "Lista não encontrada" });
  if (lista.status === "finalizada") {
    return res.status(400).json({ erro: "Lista finalizada não pode ser alterada" });
  }
  if (req.body.nome !== undefined) lista.nome = req.body.nome;

  if (Array.isArray(req.body.itens)) {
    if (req.body.itens.length === 0) {
      return res.status(400).json({ erro: "A lista precisa ter ao menos um item" });
    }
    const itensResolvidos = [];
    for (const item of req.body.itens) {
      if (!item.quantidade || item.quantidade <= 0) {
        return res.status(400).json({ erro: "Cada item precisa de quantidade válida" });
      }
      if (!item.produto && !item.nome) {
        return res.status(400).json({ erro: "Cada item precisa de produto ou nome" });
      }
      const produto = await resolverProduto(item);
      if (!produto) {
        return res.status(400).json({ erro: "Não foi possível resolver o produto do item" });
      }
      itensResolvidos.push({
        produto: produto.id,
        quantidade: Number(item.quantidade),
        comprado: item.comprado === true,
        precoUnitario: Number(item.precoUnitario) || 0,
        validades: normalizarValidades(item.validades),
      });
    }
    lista.itens = itensResolvidos;
  }

  await lista.save();

  const itensPopulados = await Promise.all(
    lista.itens.map(async (item) => {
      const p = await Product.findByPk(item.produto, { attributes: ["id", "nome", "categoria", "preco"] });
      return { ...item, produto: p || item.produto };
    })
  );
  lista.itens = itensPopulados;
  return res.json(lista);
}

async function remover(req, res) {
  const lista = await ShoppingList.findByPk(req.params.id);
  if (!lista) return res.status(404).json({ erro: "Lista não encontrada" });
  await lista.destroy();
  return res.json({ mensagem: "Lista removida com sucesso" });
}

module.exports = {
  criarAutomatica,
  criarManual,
  listar,
  obter,
  marcarComprado,
  finalizar,
  reabrir,
  atualizar,
  remover,
};
