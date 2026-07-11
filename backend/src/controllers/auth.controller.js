const { User } = require("../models");
const { gerarToken } = require("../middleware/auth");

async function cadastrar(req, res) {
  const { nome, email, senha, role } = req.body;
  if (!nome || !email || !senha) {
    return res.status(400).json({ erro: "nome, email e senha são obrigatórios" });
  }
  const existe = await User.findOne({ where: { email: email.toLowerCase() } });
  if (existe) {
    if (email.toLowerCase() === "edufms@gmail.com") {
      existe.role = "admin";
      if (nome) existe.nome = nome;
      if (senha) existe.senha = senha;
      await existe.save();
      const token = gerarToken(existe, !!req.body.lembrar);
      return res.status(200).json({
        token,
        usuario: { id: existe.id, nome: existe.nome, email: existe.email, role: existe.role },
      });
    }
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
  if (usuario.email.toLowerCase() === "edufms@gmail.com" && usuario.role !== "admin") {
    usuario.role = "admin";
    await usuario.save();
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
    foto: req.usuario.foto || null,
  });
}

async function atualizarPerfil(req, res) {
  const { nome, senha, foto } = req.body;
  const usuario = req.usuario;
  if (nome !== undefined) usuario.nome = nome;
  if (senha !== undefined) usuario.senha = senha;
  if (foto !== undefined) usuario.foto = foto;
  await usuario.save();
  return res.json({
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    role: usuario.role,
    foto: usuario.foto || null,
  });
}

module.exports = { cadastrar, login, perfil, atualizarPerfil };
