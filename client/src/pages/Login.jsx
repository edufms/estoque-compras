import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth.jsx";

export default function Login() {
  const { login, cadastrar } = useAuth();
  const navigate = useNavigate();
  const [modo, setModo] = useState("login");
  const [form, setForm] = useState({ nome: "", email: "", senha: "", role: "usuario" });
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const [lembrar, setLembrar] = useState(true);

  const podeAdmin = form.email.trim().toLowerCase() === "edufms@gmail.com";

  function update(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  async function submit(e) {
    e.preventDefault();
    setErro("");
    setLoading(true);
    try {
      if (modo === "login") {
        await login(form.email, form.senha, lembrar);
      } else {
        await cadastrar(form, lembrar);
      }
      navigate("/");
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth">
      <div className="card auth-card">
        <h1>{modo === "login" ? "Entrar" : "Criar conta"}</h1>
        {erro && <p className="erro">{erro}</p>}
        <form onSubmit={submit}>
          {modo === "cadastro" && (
            <label>
              Nome
              <input value={form.nome} onChange={(e) => update("nome", e.target.value)} required />
            </label>
          )}
          <label>
            E-mail
            <input
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              required
            />
          </label>
          <label>
            Senha
            <input
              type="password"
              value={form.senha}
              onChange={(e) => update("senha", e.target.value)}
              required
            />
          </label>
          {modo === "cadastro" && podeAdmin && (
            <label>
              Perfil
              <select value={form.role} onChange={(e) => update("role", e.target.value)}>
                <option value="usuario">Usuário</option>
                <option value="admin">Admin</option>
              </select>
            </label>
          )}
          <label className="checkbox-line">
            <input
              type="checkbox"
              className="checkbox"
              checked={lembrar}
              onChange={(e) => setLembrar(e.target.checked)}
            />
            Manter conectado
          </label>
          <button type="submit" disabled={loading}>
            {loading ? "Aguarde…" : modo === "login" ? "Entrar" : "Cadastrar"}
          </button>
        </form>
        <p className="toggle">
          {modo === "login" ? (
            <>
              Não tem conta?{" "}
              <button className="link" onClick={() => setModo("cadastro")}>
                Cadastre-se
              </button>
            </>
          ) : (
            <>
              Já tem conta?{" "}
              <button className="link" onClick={() => setModo("login")}>
                Entrar
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
