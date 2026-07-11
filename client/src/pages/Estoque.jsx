import { useEffect, useState } from "react";
import { api, getToken } from "../api.js";
import { ImportCSVModal } from "../ImportCSVModal.jsx";
import { ConsumirLoteModal } from "../ConsumirLoteModal.jsx";

function Lancar({ produto, tipo, onClose, onSalvar }) {
  const [quantidade, setQuantidade] = useState("");
  const [observacao, setObservacao] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErro("");
    setLoading(true);
    try {
      const fn = tipo === "entrada" ? api.entrada : api.saida;
      await fn(produto.id, { quantidade: Number(quantidade), observacao });
      onSalvar();
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{tipo === "entrada" ? "Entrada de estoque" : "Saída de estoque"}</h2>
        <p className="muted">{produto.nome} — atual: {produto.quantidade}</p>
        {erro && <p className="erro">{erro}</p>}
        <form onSubmit={submit}>
          <label>
            Quantidade
            <input type="number" min="0" step="0.001" value={quantidade} onChange={(e) => setQuantidade(e.target.value)} required />
          </label>
          <label>
            Observação
            <input value={observacao} onChange={(e) => setObservacao(e.target.value)} />
          </label>
          <div className="modal-actions">
            <button type="button" className="ghost" onClick={onClose}>Cancelar</button>
            <button type="submit" disabled={loading}>
              {loading ? "Salvando…" : "Confirmar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Estoque() {
  const [aba, setAba] = useState("produtos");
  const [produtos, setProdutos] = useState([]);
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [lancar, setLancar] = useState(null);
  const [importando, setImportando] = useState(false);
  const [consumirLote, setConsumirLote] = useState(null);

  async function carregarProdutos() {
    setLoading(true);
    setErro("");
    try {
      setProdutos(await api.listarProdutos());
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function carregarHistorico() {
    setLoading(true);
    setErro("");
    try {
      setHistorico(await api.historico());
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (aba === "produtos") carregarProdutos();
    else carregarHistorico();
  }, [aba]);

  async function salvarConsumo(id, quantidade, validadeData) {
    await api.saida(id, {
      quantidade: Number(quantidade),
      observacao: "Consumo",
      validadeData: validadeData || undefined,
    });
    setConsumirLote(null);
    carregarProdutos();
  }

  async function importarEstoque(itens) {
    await api.importarEstoque(itens);
    carregarProdutos();
    setImportando(false);
  }

  function exportarEstoque() {
    const token = getToken();
    const url = `/api/estoque/exportar`;
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.blob())
      .then((blob) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "estoque.csv";
        a.click();
        URL.revokeObjectURL(a.href);
      })
      .catch((err) => setErro(err.message));
  }

  return (
    <div>
      <div className="page-head">
        <h1>Estoque</h1>
        <div className="btn-row" style={{ margin: 0 }}>
          <button className={aba === "produtos" ? "" : "ghost"} onClick={() => setAba("produtos")}>
            Produtos
          </button>
          <button className={aba === "historico" ? "" : "ghost"} onClick={() => setAba("historico")}>
            Histórico
          </button>
        </div>
        <button className="ghost" onClick={() => setImportando(true)}>Importar CSV</button>
        <button className="ghost" onClick={exportarEstoque}>Exportar CSV</button>
      </div>

      {erro && <p className="erro">{erro}</p>}

      {aba === "produtos" ? (
        loading ? (
          <p className="center">Carregando…</p>
        ) : produtos.length === 0 ? (
          <div className="empty">Nenhum produto.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Categoria</th>
                <th>Qtd.</th>
                <th>Mín.</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {produtos.map((p) => (
                <tr key={p.id}>
                  <td data-label="Nome">{p.nome}</td>
                  <td data-label="Categoria">{p.categoria}</td>
                  <td data-label="Qtd.">{p.quantidade}</td>
                  <td data-label="Mín.">{p.estoqueMinimo}</td>
                  <td data-label="Status">
                    {p.quantidade <= p.estoqueMinimo ? (
                      <span className="badge warn">Abaixo do mínimo</span>
                    ) : (
                      <span className="badge ok">Ok</span>
                    )}
                  </td>
                  <td data-label="Ações">
                    <div className="td-actions">
                        <button className="small" onClick={() => setLancar({ produto: p, tipo: "entrada" })}>Entrada</button>
                        <button className="small ghost" onClick={() => setConsumirLote(p)}>Consumo</button>
                      </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      ) : loading ? (
        <p className="center">Carregando…</p>
      ) : historico.length === 0 ? (
        <div className="empty">Nenhum movimento registrado.</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Produto</th>
              <th>Tipo</th>
              <th>Qtd.</th>
              <th>Usuário</th>
              <th>Observação</th>
            </tr>
          </thead>
          <tbody>
            {historico.map((m) => (
              <tr key={m.id}>
                <td data-label="Data">{new Date(m.createdAt).toLocaleString("pt-BR")}</td>
                <td data-label="Produto">{m.produtoMov?.nome || m.produto?.nome || "—"}</td>
                <td data-label="Tipo">
                  <span className={`badge ${m.tipo === "entrada" ? "ok" : "warn"}`}>
                    {m.tipo === "entrada" ? "Entrada" : "Saída"}
                  </span>
                </td>
                <td data-label="Qtd.">{m.quantidade}</td>
                <td data-label="Usuário">{m.usuario?.nome || m.usuario?.email || "—"}</td>
                <td data-label="Observação">{m.observacao || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {lancar && (
        <Lancar
          produto={lancar.produto}
          tipo={lancar.tipo}
          onClose={() => setLancar(null)}
          onSalvar={() => {
            setLancar(null);
            carregarProdutos();
          }}
        />
      )}

      {importando && (
        <ImportCSVModal
          titulo="Importar CSV no estoque"
          onClose={() => setImportando(false)}
          onConfirm={importarEstoque}
        />
      )}

      {consumirLote && (
        <ConsumirLoteModal
          produto={consumirLote}
          onClose={() => setConsumirLote(null)}
          onConfirm={salvarConsumo}
        />
      )}
    </div>
  );
}
