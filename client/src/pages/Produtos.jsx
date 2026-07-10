import { useEffect, useState, Fragment } from "react";
import { api } from "../api.js";
import { useAuth } from "../auth.jsx";
import { carregarCategorias, getCategorias, iconeDe } from "../categorias.js";
import { ValidadesField, ListaValidades } from "../ValidadesField.jsx";

function ModalProduto({ produto, categorias = [], onClose, onSalvar }) {
  const [form, setForm] = useState({
    ...(produto || { nome: "", descricao: "", categoria: "", preco: "", quantidade: 0, estoqueMinimo: 0 }),
    validades: (produto?.validades || []).map((v) => ({
      data: v?.data ? new Date(v.data).toISOString().slice(0, 10) : "",
      quantidade: Number(v?.quantidade) || 0,
    })),
  });
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  function update(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  async function submit(e) {
    e.preventDefault();
    setErro("");
    setLoading(true);
    try {
      const validades = (form.validades || []).filter((v) => v.data);
      const totalValidades = validades.reduce((s, v) => s + (Number(v.quantidade) || 0), 0);
      const qtd = Number(form.quantidade) || 0;
      if (totalValidades > qtd) {
        throw new Error("A soma das quantidades por validade não pode exceder a quantidade total do produto");
      }
      const dados = {
        ...form,
        preco: Number(form.preco),
        quantidade: qtd,
        estoqueMinimo: Number(form.estoqueMinimo) || 0,
        validades: validades.map((v) => ({ data: v.data, quantidade: Number(v.quantidade) || 0 })),
      };
      if (produto) await api.atualizarProduto(produto._id, dados);
      else await api.criarProduto(dados);
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
        <h2>{produto ? "Editar produto" : "Novo produto"}</h2>
        {erro && <p className="erro">{erro}</p>}
        <form onSubmit={submit}>
          <label>
            Nome
            <input value={form.nome} onChange={(e) => update("nome", e.target.value)} required />
          </label>
          <label>
            Categoria
            <input
              list="categorias-produto"
              value={form.categoria}
              onChange={(e) => update("categoria", e.target.value)}
              required
            />
            <datalist id="categorias-produto">
              {categorias.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </label>
          <label>
            Descrição
            <input value={form.descricao} onChange={(e) => update("descricao", e.target.value)} />
          </label>
          <ValidadesField value={form.validades} onChange={(v) => update("validades", v)} quantidadeTotal={Number(form.quantidade) || 0} />
          <label>
            Preço (R$)
            <input type="number" step="0.01" min="0" value={form.preco} onChange={(e) => update("preco", e.target.value)} required />
          </label>
          {!produto && (
            <div style={{ display: "flex", gap: 12 }}>
              <label style={{ flex: 1 }}>
                Quantidade inicial
                <input type="number" min="0" value={form.quantidade} onChange={(e) => update("quantidade", e.target.value)} />
              </label>
              <label style={{ flex: 1 }}>
                Estoque mínimo
                <input type="number" min="0" value={form.estoqueMinimo} onChange={(e) => update("estoqueMinimo", e.target.value)} />
              </label>
            </div>
          )}
          <div className="modal-actions">
            <button type="button" className="ghost" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" disabled={loading}>
              {loading ? "Salvando…" : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Produtos() {
  const { usuario } = useAuth();
  const isAdmin = usuario?.role === "admin";
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [nome, setNome] = useState("");
  const [catFiltro, setCatFiltro] = useState("");
  const [modal, setModal] = useState(null);
  const [visao, setVisao] = useState(() => localStorage.getItem("prod_visao") || "lista");
  const [ordem, setOrdem] = useState("asc");
  const [soComSaldo, setSoComSaldo] = useState(false);
  const [categorias, setCategorias] = useState([]);

  function recarregarCategorias() {
    setCategorias(getCategorias());
  }

  useEffect(() => {
    localStorage.setItem("prod_visao", visao);
  }, [visao]);

  useEffect(() => {
    carregarCategorias();
    window.addEventListener("categorias-atualizadas", recarregarCategorias);
    return () => window.removeEventListener("categorias-atualizadas", recarregarCategorias);
  }, []);

  const categoriasUnicas = [...new Set(produtos.map((p) => p.categoria).filter(Boolean))].sort();

  const visiveis = [...produtos]
    .filter((p) => (soComSaldo ? p.quantidade > 0 : true))
    .filter((p) => (catFiltro ? p.categoria === catFiltro : true))
    .sort((a, b) =>
      ordem === "asc" ? a.nome.localeCompare(b.nome) : b.nome.localeCompare(a.nome)
    );

  const grupos = categoriasUnicas
    .map((cat) => ({ cat, itens: visiveis.filter((p) => p.categoria === cat) }))
    .filter((g) => g.itens.length > 0);
  const semCategoria = visiveis.filter((p) => !p.categoria);
  if (semCategoria.length > 0) grupos.push({ cat: "", itens: semCategoria });

  async function carregar() {
    setLoading(true);
    setErro("");
    try {
      const params = new URLSearchParams();
      if (nome) params.set("nome", nome);
      if (catFiltro) params.set("categoria", catFiltro);
      setProdutos(await api.listarProdutos(params.toString() ? `?${params}` : ""));
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  async function remover(id) {
    if (!confirm("Remover este produto?")) return;
    try {
      await api.removerProduto(id);
      carregar();
    } catch (err) {
      setErro(err.message);
    }
  }

  return (
    <div>
      <div className="page-head">
        <h1>Produtos</h1>
        {isAdmin && (
          <button onClick={() => setModal({})}>Novo produto</button>
        )}
      </div>

      <div className="filters">
        <input placeholder="Buscar por nome" value={nome} onChange={(e) => setNome(e.target.value)} />
        <select value={catFiltro} onChange={(e) => setCatFiltro(e.target.value)}>
          <option value="">Todas as categorias</option>
          {categoriasUnicas.map((c) => (
            <option key={c} value={c}>
              {iconeDe(c, categorias)} {c}
            </option>
          ))}
        </select>
        <button className="ghost" onClick={carregar}>Filtrar</button>
      </div>

      <div className="toolbar">
        <div className="seg">
          <button className={visao === "lista" ? "active" : ""} onClick={() => setVisao("lista")}>Lista</button>
          <button className={visao === "card" ? "active" : ""} onClick={() => setVisao("card")}>Card</button>
        </div>
        <button className="ghost" onClick={() => setOrdem((o) => (o === "asc" ? "desc" : "asc"))}>
          Nome {ordem === "asc" ? "↑" : "↓"}
        </button>
        <label className="checkbox-line">
          <input type="checkbox" className="checkbox" checked={soComSaldo} onChange={(e) => setSoComSaldo(e.target.checked)} />
          Apenas com saldo
        </label>
      </div>

      {erro && <p className="erro">{erro}</p>}
      {loading ? (
        <p className="center">Carregando…</p>
      ) : visiveis.length === 0 ? (
        <div className="empty">Nenhum produto encontrado.</div>
      ) : visao === "lista" ? (
        <table className="table-compact">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Preço</th>
              <th>Qtd.</th>
              <th>Mín.</th>
              <th>Validade</th>
              <th>Status</th>
              {isAdmin && <th>Ações</th>}
            </tr>
          </thead>
          <tbody>
            {grupos.map((g) => (
              <Fragment key={g.cat || "—"}>
                <tr className="grupo-row">
                  <td colSpan={isAdmin ? 7 : 6}>
                    <span className="cat-icone">{iconeDe(g.cat, categorias)}</span>{" "}
                    {g.cat || "Sem categoria"}{" "}
                    <span className="muted">({g.itens.length})</span>
                  </td>
                </tr>
                {g.itens.map((p) => (
                  <tr key={p._id}>
                    <td data-label="Nome">{p.nome}</td>
                    <td data-label="Preço">R$ {Number(p.preco).toFixed(2)}</td>
                    <td data-label="Qtd.">{p.quantidade}</td>
                    <td data-label="Mín.">{p.estoqueMinimo}</td>
                    <td data-label="Validade">
                      <ListaValidades validades={p.validades} />
                      {Array.isArray(p.validades) && p.validades.length > 1 && (
                        <span className="badge warn" style={{ marginLeft: 6 }}>Vários lotes</span>
                      )}
                    </td>
                    <td data-label="Status">
                      {p.quantidade <= p.estoqueMinimo ? (
                        <span className="badge warn">Abaixo</span>
                      ) : (
                        <span className="badge ok">Ok</span>
                      )}
                    </td>
                    {isAdmin && (
                      <td data-label="Ações">
                        <div className="td-actions">
                          <button className="small ghost" onClick={() => setModal(p)}>Editar</button>
                          <button className="small danger" onClick={() => remover(p._id)}>Excluir</button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="grupos">
          {grupos.map((g) => (
            <section key={g.cat || "—"} className="grupo">
              <div className="grupo-head">
                <span className="cat-icone">{iconeDe(g.cat, categorias)}</span>
                <span className="grupo-nome">{g.cat || "Sem categoria"}</span>
                <span className="muted">({g.itens.length})</span>
              </div>
              <div className="prod-cards">
                {g.itens.map((p) => (
                  <div className="prod-card" key={p._id}>
                    <div className="prod-card-head">
                      <span className="prod-nome">{p.nome}</span>
                      {p.quantidade <= p.estoqueMinimo ? (
                        <span className="badge warn">Abaixo</span>
                      ) : (
                        <span className="badge ok">Ok</span>
                      )}
                    </div>
                    <div className="prod-info">
                      <div><span className="muted">Preço</span><strong>R$ {Number(p.preco).toFixed(2)}</strong></div>
                      <div><span className="muted">Qtd.</span><strong>{p.quantidade}</strong></div>
                      <div><span className="muted">Mín.</span><strong>{p.estoqueMinimo}</strong></div>
                      <div><span className="muted">Validade</span><strong><ListaValidades validades={p.validades} /></strong></div>
                    </div>
                    {isAdmin && (
                      <div className="td-actions">
                        <button className="small ghost" onClick={() => setModal(p)}>Editar</button>
                        <button className="small danger" onClick={() => remover(p._id)}>Excluir</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {modal && (
        <ModalProduto
          produto={modal._id ? modal : null}
          categorias={[...new Set(produtos.map((p) => p.categoria).filter(Boolean))]}
          onClose={() => setModal(null)}
          onSalvar={() => {
            setModal(null);
            carregar();
          }}
        />
      )}
    </div>
  );
}
