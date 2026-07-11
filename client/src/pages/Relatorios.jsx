import { useEffect, useState } from "react";
import { api, getToken } from "../api.js";

function montarParams(filtros) {
  const p = new URLSearchParams();
  if (filtros.periodo && filtros.periodo !== "0") p.set("periodo", filtros.periodo);
  if (filtros.categoria) p.set("categoria", filtros.categoria);
  if (filtros.limite && filtros.limite !== "10") p.set("limite", filtros.limite);
  const s = p.toString();
  return s ? `?${s}` : "";
}

function Barra({ valor, maximo, cor }) {
  const pct = maximo > 0 ? Math.max(2, Math.min(100, (valor / maximo) * 100)) : 0;
  return (
    <div className={`barra ${cor || ""}`}>
      <span style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function Relatorios() {
  const [aba, setAba] = useState("valor");
  const [periodo, setPeriodo] = useState("0");
  const [categoria, setCategoria] = useState("");
  const [limite, setLimite] = useState("10");
  const [categorias, setCategorias] = useState([]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregarCategorias() {
      try {
        const ps = await api.listarProdutos();
        const unicas = [...new Set(ps.map((p) => p.categoria).filter(Boolean))].sort();
        setCategorias(unicas);
      } catch {
        /* ignora */
      }
    }
    carregarCategorias();
  }, []);

  async function carregar() {
    setLoading(true);
    setErro("");
    const params = montarParams({ periodo, categoria, limite });
    try {
      let res;
      if (aba === "valor") res = await api.relatorioValorTotal(params);
      else if (aba === "baixo") res = await api.relatorioEstoqueBaixo(params);
      else if (aba === "mov") res = await api.relatorioMaisMovimentados(params);
      else res = await api.relatorioListasPendentes(params);
      setData(res);
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aba, periodo, categoria, limite]);

  const tabs = [
    { id: "valor", label: "Valor total" },
    { id: "baixo", label: "Estoque baixo" },
    { id: "mov", label: "Mais movimentados" },
    { id: "pendentes", label: "Listas pendentes" },
  ];

  return (
    <div>
      <div className="page-head">
        <h1>Relatórios</h1>
        <div className="btn-row" style={{ margin: 0, flexWrap: "wrap" }}>
          {tabs.map((t) => (
            <button key={t.id} className={aba === t.id ? "" : "ghost"} onClick={() => setAba(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="filters">
        <label>
          Período
          <select value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
            <option value="0">Todos</option>
            <option value="7">Últimos 7 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="90">Últimos 90 dias</option>
          </select>
        </label>
        <label>
          Categoria
          <select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
            <option value="">Todas</option>
            {categorias.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label>
          Top
          <select value={limite} onChange={(e) => setLimite(e.target.value)}>
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
          </select>
        </label>
        <button
          className="ghost"
          onClick={async () => {
            try {
              const res = await fetch("/api/relatorios/exportar", {
                headers: { Authorization: `Bearer ${getToken()}` },
              });
              if (!res.ok) throw new Error("Erro ao exportar");
              const blob = await res.blob();
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "produtos.csv";
              a.click();
              URL.revokeObjectURL(url);
            } catch (e) {
              alert(e.message);
            }
          }}
        >
          Exportar CSV
        </button>
      </div>

      {erro && <p className="erro">{erro}</p>}
      {loading ? (
        <p className="center">Carregando…</p>
      ) : aba === "valor" ? (
        <div>
          <div className="cards">
            <div className="stat">
              <div className="label">Valor total em estoque</div>
              <div className="valor">R$ {Number(data?.valorTotal || 0).toFixed(2)}</div>
            </div>
            <div className="stat">
              <div className="label">Tipos de produtos</div>
              <div className="valor">{data?.quantidadeProdutos || 0}</div>
            </div>
            <div className="stat">
              <div className="label">Itens no estoque</div>
              <div className="valor">{data?.quantidadeTotalItens || 0}</div>
            </div>
            <div className="stat" style={{ borderLeft: "4px solid var(--warn)" }}>
              <div className="label">Abaixo do mínimo</div>
              <div className="valor">{data?.abaixoDoMinimo || 0}</div>
            </div>
          </div>
          {data?.quantidadeProdutos > 0 && (
            <div className="resumo-grafico">
              <div className="muted" style={{ marginBottom: 6 }}>
                {data.abaixoDoMinimo} de {data.quantidadeProdutos} tipos abaixo do mínimo
              </div>
              <Barra valor={data.abaixoDoMinimo} maximo={data.quantidadeProdutos} cor="warn" />
            </div>
          )}
        </div>
      ) : aba === "baixo" ? (
        data.length === 0 ? (
          <div className="empty">Nenhum produto abaixo do mínimo. 🎉</div>
        ) : (
          <div>
            <p className="muted" style={{ marginBottom: 10 }}>
              {data.length} produto(s) abaixo do mínimo
            </p>
            <table>
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Categoria</th>
                  <th>Qtd.</th>
                  <th>Mín.</th>
                  <th>Nível</th>
                </tr>
              </thead>
              <tbody>
                {data.map((p) => {
                  const ref = Math.max(p.estoqueMinimo || 1, 1);
                  const pct = Math.min(100, (p.quantidade / (ref * 2)) * 100);
                  return (
                    <tr key={p.id}>
                      <td data-label="Produto">{p.nome}</td>
                      <td data-label="Categoria">{p.categoria || "—"}</td>
                      <td data-label="Qtd.">{p.quantidade}</td>
                      <td data-label="Mín.">{p.estoqueMinimo}</td>
                      <td data-label="Nível">
                        <Barra
                          valor={pct}
                          maximo={100}
                          cor={p.quantidade <= p.estoqueMinimo ? "warn" : ""}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      ) : aba === "mov" ? (
        data.length === 0 ? (
          <div className="empty">Nenhum movimento registrado.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Produto</th>
                <th>Movimentações</th>
                <th>Entradas</th>
                <th>Saídas</th>
                <th>Qtd. ent.</th>
                <th>Qtd. saí.</th>
              </tr>
            </thead>
            <tbody>
              {data.map((m) => {
                const max = Math.max(...data.map((x) => x.totalMovimentacoes), 1);
                return (
                  <tr key={m.id}>
                    <td data-label="Produto">{m.nome || "—"}</td>
                    <td data-label="Movimentações">
                      <div className="celula-barra">
                        <span>{m.totalMovimentacoes}</span>
                        <Barra valor={m.totalMovimentacoes} maximo={max} />
                      </div>
                    </td>
                    <td data-label="Entradas">{m.entradas}</td>
                    <td data-label="Saídas">{m.saidas}</td>
                    <td data-label="Qtd. ent.">{m.totalEntradasQtd}</td>
                    <td data-label="Qtd. saí.">{m.totalSaidasQtd}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )
      ) : data.length === 0 ? (
        <div className="empty">Nenhuma lista pendente.</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Itens</th>
              <th>Valor estimado</th>
              <th>Criado por</th>
            </tr>
          </thead>
          <tbody>
            {data.map((l) => {
              const max = Math.max(...data.map((x) => x.valorEstimado || 0), 1);
              return (
                <tr key={l.id}>
                  <td data-label="Nome">{l.nome}</td>
                  <td data-label="Itens">{l.totalItens}</td>
                  <td data-label="Valor estimado">
                    <div className="celula-barra">
                      <span>R$ {Number(l.valorEstimado || 0).toFixed(2)}</span>
                      <Barra valor={l.valorEstimado || 0} maximo={max} cor="ok" />
                    </div>
                  </td>
                  <td data-label="Criado por">{l.criadoPor?.nome || "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
