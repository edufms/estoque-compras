import { createContext, useContext, useEffect, useState } from "react";
import { api, getToken, setToken, clearToken } from "./api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setCarregando(false);
      return;
    }
    api
      .perfil()
      .then(setUsuario)
      .catch(() => clearToken())
      .finally(() => setCarregando(false));
  }, []);

  async function login(email, senha, lembrar = true) {
    const { token, usuario } = await api.login(email, senha);
    setToken(token, lembrar);
    setUsuario(usuario);
    return usuario;
  }

  async function cadastrar(dados, lembrar = true) {
    const { token, usuario } = await api.cadastrar(dados);
    setToken(token, lembrar);
    setUsuario(usuario);
    return usuario;
  }

  function atualizarUsuario(dados) {
    setUsuario((prev) => ({ ...prev, ...dados }));
  }

  function logout() {
    clearToken();
    setUsuario(null);
  }

  return (
    <AuthContext.Provider
      value={{ usuario, carregando, login, cadastrar, logout, atualizarUsuario }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
