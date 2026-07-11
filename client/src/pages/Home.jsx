import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../auth.jsx";
import { statusValidade } from "../ValidadesField.jsx";

function Stat({ label, valor, to, cor }) {
  const conteudo = (
    <div className="stat" style={cor ? { borderLeft: `4px solid ${cor}` } : undefined}>
      <div className="label">{label}</div>
      <div className="valor">{valor}</div>
    </div>
  );
  return to ? <Link to={to} style={{ color: "inherit" }}>{conteudo}</Link> : conteudo;
}

export default function Home() {
  const { usuario } = useAuth();
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregar() {
      setLoading(true);
      setErro("");
      try {
        const [valor, baixo, pendentes, mov, produtos] = await Promise.all([
          api.relatorioValorTotal(),
          api.relatorioEstoqueBaixo(),
          api.relatorioListasPendentes(),
          api.historico("?limit=5"),
          api.listarProdutos(),
        ]);
        setDados({ valor, baixo, pendentes, mov, produtos });
      } catch (err) {
        setErro(err.message);
      } finally {
        setLoading(false);
      }
    }
    carregar();
  }, []);

  if (loading) return <p className="center">Carregando…</p>;
  if (erro) return <p className="erro">{erro}</p>;
  if (!dados) return null;

  const { valor, baixo, pendentes, mov, produtos } = dados;
  const cumprimento = baixo.length === 0;

  const vencimentos = [];
  for (const p of produtos || []) {
    for (const v of p.validades || []) {
      const d = new Date(v.data);
      if (!Number.isNaN(d.getTime())) {
        vencimentos.push({
          nome: p.nome,
          data: v.data,
          quantidade: Number(v.quantidade) || 0,
          status: statusValidade([d]),
        });
      }
    }
  }
  vencimentos.sort((a, b) => new Date(a.data) - new Date(b.data));
  const proximos = vencimentos.slice(0, 10);

  return (
    <div>
      <div className="page-head">
        <h1>Início</h1>
        <span className="muted">Bem-vindo(a), {usuario?.nome}</span>
      </div>



      <div className="cards" style={{ marginBottom: 24 }}>
        <Stat label="Tipos de produtos" valor={valor.quantidadeProdutos} to="/produtos" />
        <Stat
          label="Valor total em estoque"
          valor={`R$ ${Number(valor.valorTotal || 0).toFixed(2)}`}
          to="/relatorios"
          cor="var(--primary)"
        />
        <Stat
          label="Abaixo do mínimo"
          valor={baixo.length}
          to="/estoque"
          cor="var(--warn)"
        />
        <Stat
          label="Listas pendentes"
          valor={pendentes.length}
          to="/listas"
          cor="var(--success)"
        />
      </div>

      {cumprimento && (
        <div className="empty" style={{ marginBottom: 24 }}>
          ✅ Tudo certo! Nenhum produto abaixo do mínimo.
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
        <section>
          <div className="page-head" style={{ marginBottom: 10 }}>
            <h1 style={{ fontSize: 17 }}>Estoque baixo</h1>
            <Link to="/estoque"><button className="ghost small">Todos</button></Link>
          </div>
          {baixo.length === 0 ? (
            <div className="empty">Nenhum produto abaixo do mínimo.</div>
          ) : (
            <table className="tabela-resumo">
              <thead>
                <tr><th>Produto</th><th>Qtd.</th><th>Mín.</th></tr>
              </thead>
              <tbody>
                {baixo.slice(0, 6).map((p) => (
                  <tr key={p.id}>
                    <td data-label="Produto">{p.nome}</td>
                    <td data-label="Qtd.">{p.quantidade}</td>
                    <td data-label="Mín.">{p.estoqueMinimo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section>
          <div className="page-head" style={{ marginBottom: 10 }}>
            <h1 style={{ fontSize: 17 }}>Listas pendentes</h1>
            <Link to="/listas"><button className="ghost small">Todas</button></Link>
          </div>
          {pendentes.length === 0 ? (
            <div className="empty">Nenhuma lista pendente.</div>
          ) : (
            <table className="tabela-resumo">
              <thead>
                <tr><th>Lista</th><th>Itens</th></tr>
              </thead>
              <tbody>
                {pendentes.slice(0, 6).map((l) => (
                  <tr key={l.id}>
                    <td data-label="Lista">{l.nome}</td>
                    <td data-label="Itens">{l.itens.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section>
          <div className="page-head" style={{ marginBottom: 10 }}>
            <h1 style={{ fontSize: 17 }}>Últimos movimentos</h1>
            <Link to="/estoque"><button className="ghost small">Histórico</button></Link>
          </div>
          {!mov || mov.length === 0 ? (
            <div className="empty">Nenhum movimento.</div>
          ) : (
            <table className="tabela-resumo">
              <thead>
                <tr><th>Produto</th><th>Tipo</th><th>Qtd.</th></tr>
              </thead>
              <tbody>
                {mov.slice(0, 6).map((m) => (
                  <tr key={m.id}>
                    <td data-label="Produto">{m.produtoMov?.nome || m.produto?.nome || "—"}</td>
                    <td data-label="Tipo">
                      <span className={`badge ${m.tipo === "entrada" ? "ok" : "warn"}`}>
                        {m.tipo === "entrada" ? "Entrada" : "Saída"}
                      </span>
                    </td>
                    <td data-label="Qtd.">{m.quantidade}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>

      <section style={{ marginTop: 24 }}>
        <div className="page-head" style={{ marginBottom: 10 }}>
          <h1 style={{ fontSize: 17 }}>Próximos do vencimento</h1>
          <Link to="/produtos"><button className="ghost small">Todos os produtos</button></Link>
        </div>
        {proximos.length === 0 ? (
          <div className="empty">Nenhum produto com validade cadastrada.</div>
        ) : (
          <table className="tabela-resumo">
            <thead>
              <tr><th>Produto</th><th>Validade</th><th>Qtd.</th></tr>
            </thead>
            <tbody>
              {proximos.map((v, i) => (
                <tr key={`${v.nome}-${v.data}-${i}`}>
                  <td data-label="Produto">{v.nome}</td>
                  <td data-label="Validade">
                    <span className={`validade-tag ${v.status}`}>
                      {new Date(v.data).toLocaleDateString("pt-BR")}
                    </span>
                  </td>
                  <td data-label="Qtd.">{v.quantidade}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
