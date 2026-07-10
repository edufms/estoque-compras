const { User } = require("../models");
const { gerarToken } = require("../middleware/auth");
const { Op } = require("sequelize");

async function cadastrar(req, res) {
  const { nome, email, senha, role } = req.body;
  if (!nome || !email || !senha) {
    return res.status(400).json({ erro: "nome, email e senha são obrigatórios" });
  }
  const existe = await User.findOne({ where: { email: email.toLowerCase() } });
  if (existe) {
    return res.status(409).json({ erro: "E-mail já cadastrado" });
  }
  const querAdmin = role === "admin";
  if (querAdmin && email.toLowerCase() !== "edufms@gmail.com") {
    return res.status(403).json({ erro: "Apenas edufms@gmail.com pode ser administrador" });
  }
  const usuario = await User.create({
    nome,
    email,
    senha,
    role: querAdmin ? "admin" : "usuario",
  });
  const token = gerarToken(usuario, !!req.body.lembrar);
  return res.status(201).json({
    token,
    usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, role: usuario.role },
  });
}

async function login(req, res) {
  const { email, senha } = req.body;
  if (!email || !senha) {
    return res.status(400).json({ erro: "email e senha são obrigatórios" });
  }
  const usuario = await User.findOne({ where: { email: email.toLowerCase() } });
  if (!usuario) {
    return res.status(401).json({ erro: "Credenciais inválidas" });
  }
  const ok = await usuario.compararSenha(senha);
  if (!ok) {
    return res.status(401).json({ erro: "Credenciais inválidas" });
  }
  const token = gerarToken(usuario, !!req.body.lembrar);
  return res.json({
    token,
    usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, role: usuario.role },
  });
}

async function perfil(req, res) {
  return res.json({
    id: req.usuario.id,
    nome: req.usuario.nome,
    email: req.usuario.email,
    role: req.usuario.role,
  });
}

module.exports = { cadastrar, login, perfil };
