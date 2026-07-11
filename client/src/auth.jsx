import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, getToken, setToken, clearToken, getCasaId, setCasaId } from "./api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [casas, setCasas] = useState([]);
  const [casaAtual, setCasaAtual] = useState(null);

  const carregarCasas = useCallback(async () => {
    try {
      const lista = await api.casas.listar();
      setCasas(lista);
      const casaId = getCasaId();
      const casa = lista.find((c) => String(c.id) === casaId);
      if (casa) {
        setCasaId(casa.id);
        const detalhes = await api.casas.atual();
        setCasaAtual(detalhes);
      } else {
        setCasaAtual(null);
        setCasaId(null);
      }
    } catch {
      // sem casas ainda
    }
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setCarregando(false);
      return;
    }
    api
      .perfil()
      .then((u) => {
        setUsuario(u);
        return carregarCasas();
      })
      .catch(() => {
        clearToken();
      })
      .finally(() => setCarregando(false));
  }, [carregarCasas]);

  async function login(email, senha, lembrar = true) {
    const { token, usuario: u } = await api.login(email, senha);
    setToken(token, lembrar);
    setUsuario(u);
    await carregarCasas();
    return u;
  }

  async function cadastrar(dados, lembrar = true) {
    const { token, usuario: u } = await api.cadastrar(dados);
    setToken(token, lembrar);
    setUsuario(u);
    await carregarCasas();
    return u;
  }

  function atualizarUsuario(dados) {
    setUsuario((prev) => ({ ...prev, ...dados }));
  }

  function logout() {
    clearToken();
    setUsuario(null);
    setCasas([]);
    setCasaAtual(null);
  }

  async function criarCasa(nome) {
    const nova = await api.casas.criar({ nome });
    await carregarCasas();
    await trocarCasa(nova.id);
    return nova;
  }

  async function trocarCasa(casaId) {
    setCasaId(casaId);
    const detalhes = await api.casas.atual();
    setCasaAtual(detalhes);
  }

  async function entrarCasa(codigo) {
    const casa = await api.casas.entrar(codigo);
    await carregarCasas();
    await trocarCasa(casa.id);
    return casa;
  }

  async function sairCasa(casaId) {
    await api.casas.sair(casaId);
    await carregarCasas();
    const restante = casas.filter((c) => String(c.id) !== String(casaId));
    if (restante.length) {
      await trocarCasa(restante[0].id);
    } else {
      setCasaAtual(null);
      setCasaId(null);
    }
  }

  async function regenerarCodigo(casaId) {
    const { codigo } = await api.casas.regenerarCodigo(casaId);
    setCasaAtual((prev) => (prev ? { ...prev, codigo } : prev));
    return codigo;
  }

  async function removerMembro(casaId, userId) {
    await api.casas.removerMembro(casaId, userId);
    const detalhes = await api.casas.atual();
    setCasaAtual(detalhes);
  }

  async function editarCasa(casaId, nome) {
    const atualizada = await api.casas.editar(casaId, { nome });
    setCasaAtual((prev) => (prev && prev.id === casaId ? { ...prev, nome: atualizada.nome } : prev));
    await carregarCasas();
  }

  async function excluirCasa(casaId) {
    await api.casas.excluir(casaId);
    await carregarCasas();
    const restante = casas.filter((c) => String(c.id) !== String(casaId));
    if (restante.length) {
      await trocarCasa(restante[0].id);
    } else {
      setCasaAtual(null);
      setCasaId(null);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        usuario,
        carregando,
        casas,
        casaAtual,
        login,
        cadastrar,
        logout,
        atualizarUsuario,
        criarCasa,
        trocarCasa,
        entrarCasa,
        sairCasa,
        regenerarCodigo,
        removerMembro,
        editarCasa,
        excluirCasa,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
