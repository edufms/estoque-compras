import { useEffect, useState } from "react";
import {
  carregarCategorias,
  getCategorias,
  salvarCategoria,
  removerCategoria,
} from "../categorias.js";
import { api } from "../api.js";

const SUGESTOES = [
  "📦",
  "🥖",
  "🥤",
  "🧴",
  "🧹",
  "🍎",
  "🥛",
  "🧊",
  "🪣",
  "🧷",
  "📝",
  "🔧",
  "🥩",
  "🧀",
  "🥚",
  "🍞",
  "🍝",
  "🧂",
  "☕",
  "🧃",
  "🧻",
  "💊",
  "🔋",
  "💡",
  "🧰",
  "🎒",
  "👕",
  "🧸",
];

export default function Categorias() {
  const [registradas, setRegistradas] = useState([]);
  const [usadas, setUsadas] = useState([]);
  const [nome, setNome] = useState("");
  const [icone, setIcone] = useState("📦");
  const [erro, setErro] = useState("");

  function recarregar() {
    setRegistradas(getCategorias());
  }

  useEffect(() => {
    carregarCategorias();
    window.addEventListener("categorias-atualizadas", recarregar);
    return () => window.removeEventListener("categorias-atualizadas", recarregar);
  }, []);

  useEffect(() => {
    api
      .listarProdutos()
      .then((ps) => {
        const nomes = [...new Set(ps.map((p) => p.categoria).filter(Boolean))].sort((a, b) =>
          a.localeCompare(b),
        );
        setUsadas(nomes);
      })
      .catch(() => {});
  }, []);

  const mapa = Object.fromEntries(registradas.map((c) => [c.nome, c]));
  const todas = [...new Set([...registradas.map((c) => c.nome), ...usadas])].sort((a, b) =>
    a.localeCompare(b),
  );

  async function submit(e) {
    e.preventDefault();
    setErro("");
    const n = nome.trim();
    if (!n) return setErro("Informe o nome da categoria");
    try {
      await salvarCategoria(n, icone);
      setNome("");
      setIcone("📦");
    } catch (err) {
      setErro(err.message);
    }
  }

  async function remover(nomeRem) {
    if (!confirm(`Remover a categoria "${nomeRem}"?`)) return;
    try {
      await removerCategoria(nomeRem);
    } catch (err) {
      setErro(err.message);
    }
  }

  function preparar(n, ic) {
    setNome(n);
    setIcone(ic || "📦");
    setErro("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="cat-page">
      <div className="page-head">
        <h1>Categorias</h1>
      </div>

      <div className="card" style={{ marginBottom: 18 }}>
        <h2 style={{ marginTop: 0, fontSize: 16 }}>Nova categoria / definir ícone</h2>
        {erro && <p className="erro">{erro}</p>}
        <form onSubmit={submit}>
          <label>
            Nome
            <input
              list="cat-usadas"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Selecione ou digite"
              required
            />
            <datalist id="cat-usadas">
              {todas.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </label>
          <div style={{ marginTop: 12 }}>
            <span className="muted" style={{ display: "block", marginBottom: 6 }}>
              Ícone
            </span>
            <div className="icones">
              {SUGESTOES.map((s) => (
                <button
                  type="button"
                  key={s}
                  className={`icone-btn ${icone === s ? "active" : ""}`}
                  onClick={() => setIcone(s)}
                >
                  {s}
                </button>
              ))}
            </div>
            <input
              style={{ marginTop: 10 }}
              placeholder="Ou cole um emoji"
              value={icone}
              onChange={(e) => setIcone(e.target.value.slice(0, 4))}
            />
          </div>
          <div className="modal-actions">
            <button type="submit">Salvar</button>
          </div>
        </form>
      </div>

      {todas.length === 0 ? (
        <div className="empty">Nenhuma categoria encontrada.</div>
      ) : (
        <div className="prod-cards">
          {todas.map((c) => {
            const reg = mapa[c];
            return (
              <div className="prod-card" key={c}>
                <div className="prod-card-head">
                  <span className="prod-nome">
                    <span className="cat-icone">{reg ? reg.icone : "⬜"}</span> {c}
                  </span>
                  {reg ? (
                    <button className="small danger" onClick={() => remover(c)}>
                      Excluir
                    </button>
                  ) : (
                    <button className="small ghost" onClick={() => preparar(c, "📦")}>
                      Definir ícone
                    </button>
                  )}
                </div>
                {reg && (
                  <div className="td-actions">
                    <button className="small ghost" onClick={() => preparar(c, reg.icone)}>
                      Alterar ícone
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
