import { useState, useEffect } from "react";
import { useAuth } from "../auth.jsx";
import ConfirmModal from "../ConfirmModal.jsx";

export default function Casas() {
  const { usuario, casas, casaAtual, criarCasa, entrarCasa, trocarCasa, sairCasa, regenerarCodigo, removerMembro, excluirCasa } = useAuth();
  const [aba, setAba] = useState(null);
  const [nomeNova, setNomeNova] = useState("");
  const [codigoConvite, setCodigoConvite] = useState("");
  const [erro, setErro] = useState("");
  const [copiado, setCopiado] = useState(false);
  const [codigoAtual, setCodigoAtual] = useState("");
  const [modal, setModal] = useState(null);

  useEffect(() => {
    if (casaAtual) setCodigoAtual(casaAtual.codigo);
  }, [casaAtual]);

  async function handleCriar(e) {
    e.preventDefault();
    try {
      setErro("");
      await criarCasa(nomeNova);
      setNomeNova("");
      setAba(null);
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
      setAba(null);
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
    setModal({
      tipo: "remover",
      userId,
      titulo: "Remover membro",
      mensagem: "Tem certeza que deseja remover este membro?",
    });
  }

  async function handleSair() {
    setModal({
      tipo: "sair",
      titulo: "Sair desta casa",
      mensagem: "Tem certeza que deseja sair desta casa?",
    });
  }

  async function handleExcluir() {
    setModal({
      tipo: "excluir",
      titulo: "Excluir casa",
      mensagem: "Tem certeza? Todos os dados (produtos, listas, movimentos) serão perdidos permanentemente.",
    });
  }

  async function confirmarModal() {
    setErro("");
    setModal(null);
    try {
      if (modal.tipo === "sair") await sairCasa(casaAtual.id);
      else if (modal.tipo === "excluir") await excluirCasa(casaAtual.id);
      else if (modal.tipo === "remover") await removerMembro(casaAtual.id, modal.userId);
    } catch (err) {
      setErro(err.message);
    }
  }

  function copiarCodigo() {
    navigator.clipboard.writeText(codigoAtual);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  if (!casas.length) {
    if (aba === "criar") {
      return (
        <div>
          <div className="page-head"><h1>Criar Casa</h1></div>
          {erro && <p className="erro">{erro}</p>}
          <form onSubmit={handleCriar} className="modal-form" style={{ maxWidth: 400 }}>
            <label>
              Nome da casa
              <input value={nomeNova} onChange={(e) => setNomeNova(e.target.value)} placeholder="Ex: Casa, Escritório..." required autoFocus />
            </label>
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
              <button type="submit" className="btn">Criar Casa</button>
              <button type="button" className="btn btn-outline" onClick={() => setAba(null)}>Voltar</button>
            </div>
          </form>
        </div>
      );
    }

    if (aba === "entrar") {
      return (
        <div>
          <div className="page-head"><h1>Entrar em Casa</h1></div>
          {erro && <p className="erro">{erro}</p>}
          <form onSubmit={handleEntrar} className="modal-form" style={{ maxWidth: 400 }}>
            <label>
              Código de convite
              <input value={codigoConvite} onChange={(e) => setCodigoConvite(e.target.value)} placeholder="Cole o código aqui" required autoFocus />
            </label>
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
              <button type="submit" className="btn">Entrar</button>
              <button type="button" className="btn btn-outline" onClick={() => setAba(null)}>Voltar</button>
            </div>
          </form>
        </div>
      );
    }

    return (
      <div>
        <div className="page-head"><h1>Casas</h1></div>
        {erro && <p className="erro">{erro}</p>}
        <p style={{ color: "var(--muted)", marginBottom: "1.5rem" }}>Você ainda não participa de nenhuma casa. Crie uma ou entre com um código de convite.</p>
        <div className="sem-casas-acoes" style={{ justifyContent: "flex-start" }}>
          <button className="btn" onClick={() => setAba("criar")}>Criar Casa</button>
          <button className="btn" onClick={() => setAba("entrar")}>Entrar em Casa</button>
        </div>
      </div>
    );
  }

  const casaInfo = casaAtual && casas.find((c) => c.id === casaAtual.id);

  return (
    <div>
      <div className="page-head"><h1>Casas</h1></div>
      {erro && <p className="erro">{erro}</p>}

      <div className="casas-lista">
        {casas.map((c) => (
          <div
            key={c.id}
            className={`casa-item ${casaInfo && casaInfo.id === c.id ? "active" : ""}`}
            onClick={() => trocarCasa(c.id)}
          >
            <div className="casa-info">
              <strong>{c.nome}</strong>
              <small>{c.role}</small>
            </div>
          </div>
        ))}
      </div>

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
            <button className="btn btn-outline" onClick={() => setAba("criar")}>Nova Casa</button>
            <button className="btn btn-outline" onClick={() => setAba("entrar")}>Entrar em Casa</button>
            <button className="btn btn-danger" onClick={handleSair}>Sair desta casa</button>
            {casaAtual.meuPapel === "owner" && (
              <button className="btn btn-danger" onClick={handleExcluir}>Excluir casa</button>
            )}
          </div>
        </div>
      )}

      {aba === "criar" && (
        <form onSubmit={handleCriar} className="modal-form" style={{ maxWidth: 400, marginTop: "1rem" }}>
          <label>
            Nome da nova casa
            <input value={nomeNova} onChange={(e) => setNomeNova(e.target.value)} placeholder="Ex: Casa, Escritório..." required autoFocus />
          </label>
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
            <button type="submit" className="btn">Criar</button>
            <button type="button" className="btn btn-outline" onClick={() => setAba(null)}>Cancelar</button>
          </div>
        </form>
      )}

      {aba === "entrar" && (
        <form onSubmit={handleEntrar} className="modal-form" style={{ maxWidth: 400, marginTop: "1rem" }}>
          <label>
            Código de convite
            <input value={codigoConvite} onChange={(e) => setCodigoConvite(e.target.value)} placeholder="Cole o código aqui" required autoFocus />
          </label>
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
            <button type="submit" className="btn">Entrar</button>
            <button type="button" className="btn btn-outline" onClick={() => setAba(null)}>Cancelar</button>
          </div>
        </form>
      )}

      <ConfirmModal
        aberto={!!modal}
        titulo={modal?.titulo || ""}
        mensagem={modal?.mensagem || ""}
        btnConfirmar="Confirmar"
        btnCancelar="Cancelar"
        onConfirmar={confirmarModal}
        onCancelar={() => setModal(null)}
      />
    </div>
  );
}
