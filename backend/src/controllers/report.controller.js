const { Op } = require("sequelize");
const { sequelize } = require("../config/db");
const { Product, Movement, ShoppingList, User } = require("../models");

function periodoInicio(dias) {
  const n = Number(dias);
  if (!n || n <= 0) return null;
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

async function estoqueBaixo(req, res) {
  const filtro = {};
  if (req.query.categoria) filtro.categoria = req.query.categoria;
  const produtos = await Product.findAll({ where: filtro });
  const baixo = produtos
    .filter((p) => p.quantidade <= p.estoqueMinimo)
    .sort((a, b) => a.quantidade / (a.estoqueMinimo || 1) - b.quantidade / (b.estoqueMinimo || 1));
  return res.json(baixo);
}

async function valorTotalEstoque(req, res) {
  const filtro = {};
  if (req.query.categoria) filtro.categoria = req.query.categoria;
  const produtos = await Product.findAll({ where: filtro });
  const valorTotal = produtos.reduce((acc, p) => acc + p.quantidade * (p.preco || 0), 0);
  const quantidadeTotalItens = produtos.reduce((acc, p) => acc + p.quantidade, 0);
  const abaixoDoMinimo = produtos.filter((p) => p.quantidade <= p.estoqueMinimo).length;
  return res.json({
    valorTotal,
    quantidadeProdutos: produtos.length,
    quantidadeTotalItens,
    abaixoDoMinimo,
  });
}

async function maisMovimentados(req, res) {
  const limite = Number(req.query.limite) || 10;
  const inicio = periodoInicio(req.query.periodo);

  let whereClause = "";
  const replacements = { limite };
  const conditions = [];
  if (inicio) {
    conditions.push("m.createdAt >= :inicio");
    replacements.inicio = inicio;
  }
  if (req.query.categoria) {
    conditions.push("p.categoria = :categoria");
    replacements.categoria = req.query.categoria;
  }
  if (conditions.length) whereClause = "WHERE " + conditions.join(" AND ");

  const sql = `
    SELECT
      m.produto AS id,
      p.nome,
      p.categoria,
      COUNT(*) AS "totalMovimentacoes",
      COUNT(CASE WHEN m.tipo = 'entrada' THEN 1 END) AS entradas,
      COUNT(CASE WHEN m.tipo = 'saida' THEN 1 END) AS saidas,
      COALESCE(SUM(CASE WHEN m.tipo = 'entrada' THEN m.quantidade END), 0) AS "totalEntradasQtd",
      COALESCE(SUM(CASE WHEN m.tipo = 'saida' THEN m.quantidade END), 0) AS "totalSaidasQtd"
    FROM "Movements" m
    LEFT JOIN "Products" p ON p.id = m.produto
    ${whereClause}
    GROUP BY m.produto, p.nome, p.categoria
    ORDER BY "totalMovimentacoes" DESC
    LIMIT :limite
  `;

  const [resposta] = await sequelize.query(sql, { replacements });
  return res.json(resposta);
}

async function listasPendentes(req, res) {
  const filtro = { status: "pendente" };
  const inicio = periodoInicio(req.query.periodo);
  if (inicio) filtro.createdAt = { [Op.gte]: inicio };

  let listas = await ShoppingList.findAll({ where: filtro, order: [["createdAt", "DESC"]] });

  for (const l of listas) {
    if (Array.isArray(l.itens)) {
      const itemsPopulados = await Promise.all(
        l.itens.map(async (item) => {
          const p = await Product.findByPk(item.produto, { attributes: ["id", "nome", "categoria"] });
          return { ...item, produto: p || item.produto };
        })
      );
      l.itens = itemsPopulados;
    }
    const criador = await User.findByPk(l.criadoPor, { attributes: ["id", "nome"] });
    l.dataValues.criadoPor = criador || l.criadoPor;
  }

  if (req.query.categoria) {
    listas = listas.filter((l) =>
      l.itens.some((i) => i.produto && i.produto.categoria === req.query.categoria)
    );
  }

  const resposta = listas.map((l) => {
    const obj = l.toJSON();
    obj.totalItens = l.itens.reduce((s, i) => s + (Number(i.quantidade) || 0), 0);
    obj.valorEstimado = l.itens.reduce(
      (s, i) => s + (Number(i.precoUnitario) || 0) * (Number(i.quantidade) || 0),
      0
    );
    return obj;
  });

  return res.json(resposta);
}

module.exports = { estoqueBaixo, valorTotalEstoque, maisMovimentados, listasPendentes };
