import { useState, useEffect } from "react";
import { useAuth } from "./auth.jsx";

export default function CasaModal({ aberto, onFechar }) {
  const { usuario, casas, casaAtual, criarCasa, entrarCasa, trocarCasa, sairCasa, regenerarCodigo, removerMembro, excluirCasa } = useAuth();
  const [aba, setAba] = useState("listar");
  const [nomeNova, setNomeNova] = useState("");
  const [codigoConvite, setCodigoConvite] = useState("");
  const [erro, setErro] = useState("");
  const [copiado, setCopiado] = useState(false);
  const [codigoAtual, setCodigoAtual] = useState("");

  useEffect(() => {
    if (casaAtual) setCodigoAtual(casaAtual.codigo);
  }, [casaAtual]);

  if (!aberto) return null;

  async function handleCriar(e) {
    e.preventDefault();
    try {
      setErro("");
      await criarCasa(nomeNova);
      setNomeNova("");
      setAba("listar");
    } catch (err) {
      setErro(err.message);
    }
  }

  async function handleEntrar(e) {
    e.preventDefault();
    try {
      setErro("");
      await entrarCasa(codigoConvite);
      setCodigoConvite("");
      setAba("listar");
    } catch (err) {
      setErro(err.message);
    }
  }

  async function handleRegenerar() {
    try {
      setErro("");
      const codigo = await regenerarCodigo(casaAtual.id);
      setCodigoAtual(codigo);
    } catch (err) {
      setErro(err.message);
    }
  }

  async function handleRemoverMembro(userId) {
    if (!confirm("Remover este membro?")) return;
    try {
      setErro("");
      await removerMembro(casaAtual.id, userId);
    } catch (err) {
      setErro(err.message);
    }
  }

  async function handleSair() {
    if (!confirm("Sair desta casa?")) return;
    try {
      setErro("");
      await sairCasa(casaAtual.id);
    } catch (err) {
      setErro(err.message);
    }
  }

  async function handleExcluir() {
    if (!confirm("Excluir esta casa? Todos os dados serão perdidos.")) return;
    try {
      setErro("");
      await excluirCasa(casaAtual.id);
    } catch (err) {
      setErro(err.message);
    }
  }

  function copiarCodigo() {
    navigator.clipboard.writeText(codigoAtual);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <div className="modal-overlay" onClick={onFechar}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
        <div className="modal-header">
          <h2>Gerenciar Casas</h2>
          <button className="modal-fechar" onClick={onFechar}>✕</button>
        </div>

        {casas.length === 0 ? (
          <div className="sem-casas">
            <p>Você ainda não tem nenhuma casa. Crie uma nova ou entre em uma existente.</p>
            <div className="sem-casas-acoes">
              <button className="btn" onClick={() => setAba("criar")}>Criar Casa</button>
              <button className="btn" onClick={() => setAba("entrar")}>Entrar em Casa</button>
            </div>
          </div>
        ) : (
        <div className="tabs">
          <button className={`tab ${aba === "listar" ? "active" : ""}`} onClick={() => setAba("listar")}>Minhas Casas</button>
          <button className={`tab ${aba === "criar" ? "active" : ""}`} onClick={() => setAba("criar")}>Nova Casa</button>
          <button className={`tab ${aba === "entrar" ? "active" : ""}`} onClick={() => setAba("entrar")}>Entrar</button>
        </div>
        )}

        {erro && <p className="erro">{erro}</p>}

        {aba === "listar" && (
          <div className="casas-lista">
            {casas.map((c) => (
              <div
                key={c.id}
                className={`casa-item ${casaAtual && casaAtual.id === c.id ? "active" : ""}`}
              >
                <div className="casa-info" onClick={() => { trocarCasa(c.id); onFechar(); }}>
                  <strong>{c.nome}</strong>
                  <small>{c.role} · {c.codigo}</small>
                </div>
              </div>
            ))}

            {casaAtual && (
              <div className="casa-detalhes">
                <h4>Convite</h4>
                <div className="codigo-convite">
                  <code>{codigoAtual}</code>
                  <button className="btn btn-sm" onClick={copiarCodigo}>
                    {copiado ? "Copiado!" : "Copiar"}
                  </button>
                  {(casaAtual.meuPapel === "owner" || casaAtual.meuPapel === "admin") && (
                    <button className="btn btn-sm" onClick={handleRegenerar}>Regenerar</button>
                  )}
                </div>

                <h4>Membros ({casaAtual.membros?.length || 0})</h4>
                <ul className="membros-lista">
                  {casaAtual.membros?.map((m) => (
                    <li key={m.id} className="membro-item">
                      <div className="membro-avatar">
                        {m.foto ? <img src={m.foto} alt="" /> : <span>{(m.nome || "?")[0]}</span>}
                      </div>
                      <div className="membro-info">
                        <strong>{m.nome}</strong>
                        <small>{m.role} · {m.email}</small>
                      </div>
                      {(casaAtual.meuPapel === "owner" || casaAtual.meuPapel === "admin") && m.id !== usuario?.id && (
                        <button className="btn btn-sm btn-danger" onClick={() => handleRemoverMembro(m.id)}>Remover</button>
                      )}
                    </li>
                  ))}
                </ul>

                <div className="casa-acoes">
                  <button className="btn btn-danger" onClick={handleSair}>Sair desta casa</button>
                  {casaAtual.meuPapel === "owner" && (
                    <button className="btn btn-danger" onClick={handleExcluir}>Excluir casa</button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {aba === "criar" && (
          <form onSubmit={handleCriar} className="modal-form">
            <label>
              Nome da casa
              <input value={nomeNova} onChange={(e) => setNomeNova(e.target.value)} placeholder="Ex: Casa, Escritório..." required />
            </label>
            <button type="submit" className="btn">Criar Casa</button>
          </form>
        )}

        {aba === "entrar" && (
          <form onSubmit={handleEntrar} className="modal-form">
            <label>
              Código de convite
              <input value={codigoConvite} onChange={(e) => setCodigoConvite(e.target.value)} placeholder="Cole o código aqui" required />
            </label>
            <button type="submit" className="btn">Entrar</button>
          </form>
        )}
      </div>
    </div>
  );
}
