const { House, HouseMember, User } = require("../models");

async function listar(req, res) {
  const membros = await HouseMember.findAll({
    where: { userId: req.usuario.id },
    include: [{ model: House, as: "casa" }],
  });
  const casas = membros.map((m) => ({
    id: m.casa.id,
    nome: m.casa.nome,
    role: m.role,
    codigo: m.casa.codigo,
  }));
  return res.json(casas);
}

async function criar(req, res) {
  const { nome } = req.body;
  const house = await House.create({
    nome: nome || "Nova Casa",
    codigo: House.gerarCodigo(),
    criadoPor: req.usuario.id,
  });
  await HouseMember.create({
    houseId: house.id,
    userId: req.usuario.id,
    role: "owner",
  });
  return res.status(201).json({
    id: house.id,
    nome: house.nome,
    codigo: house.codigo,
    role: "owner",
  });
}

async function atual(req, res) {
  const casaId = req.headers["x-casa-id"] || req.casaId;
  if (!casaId) {
    return res.status(400).json({ erro: "Nenhuma casa selecionada" });
  }
  const house = await House.findByPk(casaId);
  if (!house) return res.status(404).json({ erro: "Casa não encontrada" });
  const membros = await HouseMember.findAll({
    where: { houseId: casaId },
    include: [{ model: User, as: "usuario", attributes: ["id", "nome", "email", "foto"] }],
  });
  const meuPapel = membros.find((m) => m.userId === req.usuario.id)?.role || "member";
  return res.json({
    id: house.id,
    nome: house.nome,
    codigo: house.codigo,
    meuPapel,
    membros: membros.map((m) => ({
      id: m.usuario.id,
      nome: m.usuario.nome,
      email: m.usuario.email,
      foto: m.usuario.foto,
      role: m.role,
    })),
  });
}

async function entrar(req, res) {
  const { codigo } = req.body;
  if (!codigo) {
    return res.status(400).json({ erro: "Código de convite é obrigatório" });
  }
  const house = await House.findOne({ where: { codigo: codigo.trim() } });
  if (!house) {
    return res.status(404).json({ erro: "Código de convite inválido" });
  }
  const existe = await HouseMember.findOne({
    where: { houseId: house.id, userId: req.usuario.id },
  });
  if (existe) {
    return res.status(409).json({ erro: "Você já é membro desta casa" });
  }
  await HouseMember.create({
    houseId: house.id,
    userId: req.usuario.id,
    role: "member",
  });
  const membros = await HouseMember.count({ where: { houseId: house.id } });
  return res.json({
    id: house.id,
    nome: house.nome,
    codigo: house.codigo,
    totalMembros: membros,
  });
}

async function sair(req, res) {
  const houseId = req.params.id;
  const member = await HouseMember.findOne({
    where: { houseId, userId: req.usuario.id },
  });
  if (!member) return res.status(404).json({ erro: "Você não é membro desta casa" });
  if (member.role === "owner") {
    const totalOwners = await HouseMember.count({
      where: { houseId, role: "owner" },
    });
    if (totalOwners <= 1) {
      return res.status(400).json({
        erro: "Você é o único proprietário. Transfira a propriedade ou exclua a casa.",
      });
    }
  }
  await member.destroy();
  return res.json({ mensagem: "Você saiu da casa" });
}

async function regenerarCodigo(req, res) {
  const house = await House.findByPk(req.params.id);
  if (!house) return res.status(404).json({ erro: "Casa não encontrada" });
  const member = await HouseMember.findOne({
    where: { houseId: house.id, userId: req.usuario.id },
  });
  if (!member || (member.role !== "owner" && member.role !== "admin")) {
    return res.status(403).json({ erro: "Apenas administradores podem regenerar o código" });
  }
  let codigo;
  let exists = true;
  while (exists) {
    codigo = House.gerarCodigo();
    exists = await House.findOne({ where: { codigo } });
  }
  house.codigo = codigo;
  await house.save();
  return res.json({ codigo: house.codigo });
}

async function removerMembro(req, res) {
  const { id: houseId, userId } = req.params;
  const member = await HouseMember.findOne({
    where: { houseId, userId: req.usuario.id },
  });
  if (!member || (member.role !== "owner" && member.role !== "admin")) {
    return res.status(403).json({ erro: "Sem permissão" });
  }
  if (Number(userId) === req.usuario.id) {
    return res.status(400).json({ erro: "Use sair para se remover" });
  }
  const alvo = await HouseMember.findOne({ where: { houseId, userId } });
  if (!alvo) return res.status(404).json({ erro: "Membro não encontrado" });
  if (alvo.role === "owner" && member.role !== "owner") {
    return res.status(403).json({ erro: "Apenas o proprietário pode remover outro proprietário" });
  }
  await alvo.destroy();
  return res.json({ mensagem: "Membro removido" });
}

async function editar(req, res) {
  const { nome } = req.body;
  if (!nome || !nome.trim()) {
    return res.status(400).json({ erro: "Nome é obrigatório" });
  }
  const house = await House.findByPk(req.params.id);
  if (!house) return res.status(404).json({ erro: "Casa não encontrada" });
  const member = await HouseMember.findOne({
    where: { houseId: house.id, userId: req.usuario.id },
  });
  if (!member || (member.role !== "owner" && member.role !== "admin")) {
    return res.status(403).json({ erro: "Sem permissão para editar" });
  }
  house.nome = nome.trim();
  await house.save();
  return res.json({ id: house.id, nome: house.nome, codigo: house.codigo });
}

async function excluir(req, res) {
  const house = await House.findByPk(req.params.id);
  if (!house) return res.status(404).json({ erro: "Casa não encontrada" });
  const member = await HouseMember.findOne({
    where: { houseId: house.id, userId: req.usuario.id, role: "owner" },
  });
  if (!member) {
    return res.status(403).json({ erro: "Apenas o proprietário pode excluir a casa" });
  }
  await HouseMember.destroy({ where: { houseId: house.id } });
  await house.destroy();
  return res.json({ mensagem: "Casa excluída" });
}

module.exports = { listar, criar, atual, entrar, sair, regenerarCodigo, removerMembro, editar, excluir };
