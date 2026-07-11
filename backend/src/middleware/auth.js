const jwt = require("jsonwebtoken");
const config = require("../config");
const { User, HouseMember } = require("../models");

function gerarToken(usuario, lembrar = false) {
  return jwt.sign({ id: usuario.id, role: usuario.role }, config.jwtSecret, {
    expiresIn: lembrar ? "30d" : config.jwtExpiresIn,
  });
}

async function autenticar(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ erro: "Token não fornecido" });
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, config.jwtSecret);
    const usuario = await User.findByPk(decoded.id);
    if (!usuario) {
      return res.status(401).json({ erro: "Usuário não encontrado" });
    }
    req.usuario = usuario;

    const casaHeader = req.headers["x-casa-id"];
    if (casaHeader) {
      const member = await HouseMember.findOne({
        where: { houseId: Number(casaHeader), userId: usuario.id },
      });
      if (!member) {
        return res.status(403).json({ erro: "Acesso negado a esta casa" });
      }
      req.casaId = Number(casaHeader);
    } else {
      const member = await HouseMember.findOne({ where: { userId: usuario.id } });
      req.casaId = member ? member.houseId : null;
    }

    next();
  } catch (err) {
    return res.status(401).json({ erro: "Token inválido ou expirado" });
  }
}

function autorizar(...roles) {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({ erro: "Não autenticado" });
    }
    if (roles.length && !roles.includes(req.usuario.role)) {
      return res.status(403).json({ erro: "Acesso negado" });
    }
    next();
  };
}

module.exports = { gerarToken, autenticar, autorizar };
