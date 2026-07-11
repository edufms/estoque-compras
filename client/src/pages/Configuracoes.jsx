import { useState } from "react";
import { api } from "../api.js";
import { useAuth } from "../auth.jsx";

export default function Configuracoes() {
  const { usuario, atualizarUsuario } = useAuth();
  const [nome, setNome] = useState(usuario?.nome || "");
  const [senha, setSenha] = useState("");
  const [foto, setFoto] = useState(usuario?.foto || "");
  const [salvando, setSalvando] = useState(false);
  const [ok, setOk] = useState(false);
  const [erro, setErro] = useState("");

  async function handleFoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErro("Selecione uma imagem");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setFoto(ev.target.result);
    reader.readAsDataURL(file);
  }

  async function submit(e) {
    e.preventDefault();
    setSalvando(true);
    setErro("");
    setOk(false);
    try {
      const body = { nome };
      if (senha) body.senha = senha;
      if (foto !== usuario?.foto) body.foto = foto;
      const perfil = await api.atualizarPerfil(body);
      atualizarUsuario(perfil);
      setSenha("");
      setOk(true);
    } catch (err) {
      setErro(err.message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div>
      <div className="page-head">
        <h1>Configurações</h1>
      </div>

      <div className="card" style={{ maxWidth: 480 }}>
        {erro && <p className="erro">{erro}</p>}
        {ok && <p className="sucesso">Perfil atualizado!</p>}
        <form onSubmit={submit}>
          <div className="foto-upload">
            {foto ? (
              <img src={foto} alt="foto" className="avatar" />
            ) : (
              <div className="avatar avatar-placeholder">{usuario?.nome?.[0] || "?"}</div>
            )}
            <label className="btn-foto">
              {foto ? "Trocar foto" : "Adicionar foto"}
              <input type="file" accept="image/*" onChange={handleFoto} hidden />
            </label>
            {foto && (
              <button type="button" className="ghost small" onClick={() => setFoto("")}>
                Remover
              </button>
            )}
          </div>

          <label>
            Nome
            <input value={nome} onChange={(e) => setNome(e.target.value)} required />
          </label>

          <label>
            Email
            <input value={usuario?.email || ""} disabled className="input-disabled" />
          </label>

          <label>
            Nova senha <span className="muted">(deixe em branco para manter)</span>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </label>

          <div className="modal-actions">
            <button type="submit" disabled={salvando}>
              {salvando ? "Salvando…" : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}