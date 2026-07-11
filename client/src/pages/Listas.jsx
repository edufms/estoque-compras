import { useEffect, useState } from "react";
import { api } from "../api.js";
import { ValidadesField } from "../ValidadesField.jsx";
import { ImportCSVModal } from "../ImportCSVModal.jsx";
import { AlertModal } from "../AlertModal.jsx";

function ModalManual({ produtos, onClose, onSalvar }) {
  const [nome, setNome] = useState("");
  const [itens, setItens] = useState([{ nome: "", categoria: "", quantidade: 1, validades: [], precoUnitario: "" }]);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const categorias = [...new Set(produtos.map((p) => p.categoria).filter(Boolean))];
  const nomesProdutos = [...new Set(produtos.map((p) => p.nome).filter(Boolean))];

  function updateItem(i, campo, valor) {
    setItens((arr) => arr.map((it, idx) => (idx === i ? { ...it, [campo]: valor } : it)));
  }

  function addItem() {
    setItens((arr) => [...arr, { nome: "", categoria: "", quantidade: 1, validades: [], precoUnitario: "" }]);
  }

  function removeItem(i) {
    setItens((arr) => arr.filter((_, idx) => idx !== i));
  }

  async function submit(e) {
    e.preventDefault();
    setErro("");
    setLoading(true);
    try {
      const listaItens = itens
        .filter((i) => i.nome && i.nome.trim())
        .map((i) => ({
          nome: i.nome.trim(),
          categoria: i.categoria.trim(),
          quantidade: Number(i.quantidade) || 1,
          precoUnitario: Number(i.precoUnitario) || 0,
          validades: (i.validades || []).filter(Boolean),
        }));
      if (listaItens.length === 0) throw new Error("Adicione ao menos um item com nome");
      for (const it of listaItens) {
        const soma = (it.validades || []).reduce((s, v) => s + (Number(v.quantidade) || 0), 0);
        if (soma > it.quantidade) {
          throw new Error(
            `A soma das validades de "${it.nome}" não pode exceder a quantidade (${it.quantidade})`,
          );
        }
      }
      await api.listaManual({ nome: nome || undefined, itens: listaItens });
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
        <h2>Nova lista manual</h2>
        <p className="muted">Digite o nome do produto. Se não existir, ele será cadastrado.</p>
        {erro && <p className="erro">{erro}</p>}
        <form onSubmit={submit}>
          <label>
            Nome da lista (opcional)
            <input value={nome} onChange={(e) => setNome(e.target.value)} />
          </label>
          {itens.map((it, i) => (
            <div
              key={i}
              style={{
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: 10,
                marginBottom: 8,
              }}
            >
              <label>
                Produto
                <CampoSugerido
                  value={it.nome}
                  opcoes={nomesProdutos}
                  placeholder="Nome do produto"
                  onChange={(v) => updateItem(i, "nome", v)}
                />
              </label>
              <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "flex-end" }}>
                <label style={{ flex: 1 }}>
                  Categoria (se novo)
                  <CampoSugerido
                    value={it.categoria}
                    opcoes={categorias}
                    placeholder="Categoria"
                    onChange={(v) => updateItem(i, "categoria", v)}
                  />
                </label>
                <label style={{ width: 90 }}>
                  Qtd.
                  <input
                    type="number"
                    min="0"
                    step="0.001"
                    value={it.quantidade}
                    onChange={(e) => updateItem(i, "quantidade", e.target.value)}
                  />
                </label>
                <label style={{ width: 120 }}>
                  Preço (R$)
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={it.precoUnitario}
                    onChange={(e) => updateItem(i, "precoUnitario", e.target.value)}
                    placeholder="0,00"
                  />
                </label>
                <button
                  type="button"
                  className="small danger"
                  onClick={() => removeItem(i)}
                  disabled={itens.length === 1}
                >
                  ✕
                </button>
              </div>
              <ValidadesField
                value={it.validades}
                onChange={(v) => updateItem(i, "validades", v)}
                quantidadeTotal={Number(it.quantidade) || 0}
              />
            </div>
          ))}
          <button type="button" className="ghost" onClick={addItem} style={{ width: "100%", marginTop: 8, background: "var(--surface-2)", fontWeight: 600 }}>
            + Adicionar item
          </button>
          <div className="modal-actions">
            <button type="button" className="ghost" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" disabled={loading}>
              {loading ? "Salvando…" : "Criar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ModalFinalizar({ lista, onClose, onConfirm }) {
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const total = lista.itens.reduce(
    (s, it) => s + (Number(it.precoUnitario) || 0) * (Number(it.quantidade) || 0),
    0,
  );

  async function confirmar(e) {
    e.preventDefault();
    setErro("");
    setLoading(true);
    try {
      await onConfirm();
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Finalizar lista</h2>
        <p className="muted">
          Ao finalizar, {lista.itens.length} item(ns) serão adicionados ao estoque. O preço de cada
          produto será atualizado para o valor unitário informado na lista.
        </p>
        <div className="resumo-finalizar">
          <span className="muted">Valor total estimado da compra</span>
          <strong>R$ {total.toFixed(2)}</strong>
        </div>
        {erro && <p className="erro">{erro}</p>}
        <form onSubmit={confirmar}>
          <div className="modal-actions">
            <button type="button" className="ghost" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" disabled={loading}>
              {loading ? "Finalizando…" : "Finalizar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ItemLinha({
  item,
  editando,
  categorias,
  nomes,
  onToggle,
  onEditar,
  onSalvar,
  onCancelar,
  onRemover,
}) {
  const [form, setForm] = useState({
    nome: item.nome,
    categoria: item.categoria,
    quantidade: item.quantidade,
    precoUnitario: item.precoUnitario,
    validades: item.validades || [],
  });

  useEffect(() => {
    if (editando) {
      setForm({
        nome: item.nome,
        categoria: item.categoria,
        quantidade: item.quantidade,
        precoUnitario: item.precoUnitario,
        validades: item.validades || [],
      });
    }
  }, [editando]);

  if (!editando) {
    const total = (Number(item.precoUnitario) || 0) * (Number(item.quantidade) || 0);
    return (
      <div className={`list-item ${item.comprado ? "done" : ""}`} onClick={onEditar}>
        <input
          type="checkbox"
          className="checkbox"
          checked={item.comprado}
          onClick={(e) => e.stopPropagation()}
          onChange={onToggle}
        />
        <span className="nome">{item.nome || "Produto"}</span>
        <span className="muted">× {item.quantidade}</span>
        <span className="muted">R$ {Number(item.precoUnitario || 0).toFixed(2)}</span>
        <span className="item-total">R$ {total.toFixed(2)}</span>
      </div>
    );
  }

  function upd(campo, v) {
    setForm((f) => ({ ...f, [campo]: v }));
  }

  return (
    <div className="list-item editando" onClick={(e) => e.stopPropagation()}>
      <label className="edit-campo grow">
        Produto
        <CampoSugerido
          value={form.nome}
          opcoes={nomes}
          placeholder="Nome do produto"
          autoFocus
          onChange={(v) => upd("nome", v)}
        />
      </label>
      <label className="edit-campo grow">
        Categoria
        <CampoSugerido
          value={form.categoria}
          opcoes={categorias}
          placeholder="Categoria"
          onChange={(v) => upd("categoria", v)}
        />
      </label>
      <label className="edit-campo qtd">
        Qtd.
        <input
          type="number"
          min="0"
          step="0.001"
          value={form.quantidade}
          onChange={(e) => upd("quantidade", e.target.value)}
        />
      </label>
      <label className="edit-campo valor">
        Valor unit.
        <input
          type="number"
          step="0.01"
          min="0"
          value={form.precoUnitario}
          onChange={(e) => upd("precoUnitario", e.target.value)}
        />
      </label>
      <ValidadesField
        value={form.validades}
        onChange={(v) => upd("validades", v)}
        quantidadeTotal={Number(form.quantidade) || 0}
      />
      <div className="td-actions">
        <button type="button" className="small" onClick={() => onSalvar(form)}>
          Salvar
        </button>
        <button type="button" className="small ghost" onClick={onCancelar}>
          Cancelar
        </button>
        <button type="button" className="small danger" onClick={onRemover}>
          ✕
        </button>
      </div>
    </div>
  );
}

function CampoSugerido({ value, opcoes, onChange, placeholder, autoFocus }) {
  const [aberto, setAberto] = useState(false);
  const [foco, setFoco] = useState(false);

  const filtradas = !value.trim()
    ? opcoes.slice(0, 8)
    : opcoes.filter((o) => o.toLowerCase().includes(value.trim().toLowerCase())).slice(0, 8);

  return (
    <div className="campo-sugerido">
      <input
        value={value}
        placeholder={placeholder}
        autoFocus={autoFocus}
        onChange={(e) => {
          onChange(e.target.value);
          setAberto(true);
        }}
        onFocus={() => {
          setFoco(true);
          setAberto(true);
        }}
        onBlur={() => setTimeout(() => setAberto(false), 250)}
      />
      {aberto && foco && filtradas.length > 0 && (
        <ul className="sugestoes">
          {filtradas.map((o) => (
            <li
              key={o}
              onMouseDown={() => {
                onChange(o);
                setAberto(false);
              }}
            >
              {o}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function DetalheLista({ lista, produtos, onClose, onChanged, onFinalizar, onReabrir }) {
  const [nome, setNome] = useState(lista.nome || "");
  const [itens, setItens] = useState(() => ordenar(lista.itens.map(normalizar)));
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [editandoNome, setEditandoNome] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [importando, setImportando] = useState(false);

  const categorias = [...new Set(produtos.map((p) => p.categoria).filter(Boolean))];
  const nomes = [...new Set(produtos.map((p) => p.nome).filter(Boolean))];

  function normalizar(it) {
    return {
      id: it.id || it.produto?.id || `tmp-${Math.random().toString(36).slice(2)}`,
      produto: it.produto?.id || it.produto || null,
      nome: it.produto?.nome || "",
      categoria: it.produto?.categoria || "",
      quantidade: it.quantidade,
      comprado: !!it.comprado,
      precoUnitario: it.precoUnitario != null ? it.precoUnitario : it.produto?.preco || 0,
      validades: (it.validades || []).map((v) => ({
        data: v?.data ? new Date(v.data).toISOString().slice(0, 10) : "",
        quantidade: Number(v?.quantidade) || 0,
      })),
      editando: false,
    };
  }

  function ordenar(arr) {
    return [...arr].sort((a, b) => Number(a.comprado) - Number(b.comprado));
  }

  const totalLista = itens.reduce(
    (s, it) => s + (Number(it.precoUnitario) || 0) * (Number(it.quantidade) || 0),
    0,
  );
  const totalMarcado = itens
    .filter((it) => it.comprado)
    .reduce((s, it) => s + (Number(it.precoUnitario) || 0) * (Number(it.quantidade) || 0), 0);

  async function persistir(novos, nomeLista) {
    setSalvando(true);
    setErro("");
    try {
      const payload = novos
        .filter((it) => it.nome && it.nome.trim())
        .map((it) => ({
          nome: it.nome.trim(),
          categoria: it.categoria ? it.categoria.trim() : "",
          quantidade: Number(it.quantidade) || 1,
          comprado: !!it.comprado,
          precoUnitario: Number(it.precoUnitario) || 0,
          validades: (it.validades || []).filter(Boolean),
        }));
      if (payload.length === 0) throw new Error("Adicione ao menos um item com nome");
      for (const it of payload) {
        const soma = (it.validades || []).reduce((s, v) => s + (Number(v.quantidade) || 0), 0);
        if (soma > it.quantidade) {
          throw new Error(
            `A soma das validades de "${it.nome}" não pode exceder a quantidade (${it.quantidade})`,
          );
        }
      }
      await api.atualizarLista(lista.id, { nome: nomeLista || undefined, itens: payload });
      if (onChanged) onChanged();
    } catch (err) {
      setErro(err.message);
      throw err;
    } finally {
      setSalvando(false);
    }
  }

  function adicionar() {
    const novoId = `tmp-${Math.random().toString(36).slice(2)}`;
    setItens((arr) => [
      ...arr,
      {
        id: novoId,
        produto: null,
        nome: "",
        categoria: "",
        quantidade: 1,
        comprado: false,
        precoUnitario: 0,
        validades: [],
      },
    ]);
    setEditandoId(novoId);
  }

  async function toggle(item) {
    const novos = ordenar(
      itens.map((it) => (it === item ? { ...it, comprado: !it.comprado } : it)),
    );
    setItens(novos);
    try {
      await persistir(novos, nome);
    } catch {
      setItens(itens);
    }
  }

  async function salvar(item, dados) {
    const novos = itens.map((it) => (it === item ? { ...it, ...dados } : it));
    setItens(ordenar(novos));
    setEditandoId(null);
    try {
      await persistir(novos, nome);
    } catch {
      setItens(itens);
    }
  }

  function cancelar(item) {
    if (!item.produto && !item.nome?.trim()) {
      setItens((arr) => arr.filter((it) => it !== item));
      setEditandoId(null);
      return;
    }
    setEditandoId(null);
  }

  async function importarCSV(csvItens) {
    const novos = csvItens.map((it) => ({
      id: `tmp-${Math.random().toString(36).slice(2)}`,
      produto: null,
      nome: it.nome,
      categoria: it.categoria,
      quantidade: it.quantidade,
      comprado: false,
      precoUnitario: it.valorUnitario,
      validades: it.validade ? [{ data: it.validade, quantidade: it.quantidade }] : [],
    }));
    try {
      await persistir(ordenar([...itens, ...novos]), nome);
      setImportando(false);
    } catch (err) {
      setErro(err.message);
    }
  }

  async function remover(item) {
    const novos = ordenar(itens.filter((it) => it !== item));
    setItens(novos);
    try {
      await persistir(novos, nome);
    } catch {
      setItens(itens);
    }
  }

  async function salvarNome() {
    try {
      await persistir(itens, nome);
    } catch {}
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 600 }} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" aria-label="Fechar" onClick={onClose}>
          ×
        </button>
        {editandoNome ? (
          <input
            className="titulo-edicao"
            autoFocus
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            onBlur={() => {
              setEditandoNome(false);
              salvarNome();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
            }}
          />
        ) : (
          <h2
            className="titulo-editavel"
            title="Clique para editar"
            onClick={() => setEditandoNome(true)}
          >
            {nome || "Sem nome"}
          </h2>
        )}

        <div className="resumo-lista">
          <div>
            <span className="muted">Valor total da lista</span>
            <strong> R$ {totalLista.toFixed(2)}</strong>
          </div>
          <div>
            <span className="muted">Valor dos itens marcados</span>
            <strong> R$ {totalMarcado.toFixed(2)}</strong>
          </div>
        </div>

        <div className="itens-lista">
          {itens.length === 0 && <p className="muted">Nenhum item. Adicione abaixo.</p>}
          {itens.map((it) => (
            <ItemLinha
              key={it.id}
              item={it}
              editando={editandoId === it.id}
              categorias={categorias}
              nomes={nomes}
              onToggle={() => toggle(it)}
              onEditar={() => setEditandoId(it.id)}
              onSalvar={(d) => salvar(it, d)}
              onCancelar={() => cancelar(it)}
              onRemover={() => remover(it)}
            />
          ))}
        </div>

        {erro && <p className="erro">{erro}</p>}

        <div className="modal-actions" style={{ justifyContent: "space-between" }}>
          <button type="button" className="ghost btn-sm" onClick={adicionar} disabled={salvando}>
            + Adicionar item
          </button>
          <div className="td-actions">
            {lista.status === "pendente" && (
              <button
                type="button"
                className="btn-sm"
                disabled={salvando}
                onClick={() => onFinalizar(lista)}
              >
                Finalizar lista
              </button>
            )}
            {lista.status === "finalizada" && (
              <button
                type="button"
                className="btn-sm"
                disabled={salvando}
                onClick={() => onReabrir(lista)}
              >
                Reabrir lista
              </button>
            )}
            {lista.status === "pendente" && (
              <button
                type="button"
                className="ghost btn-sm"
                disabled={salvando}
                onClick={() => setImportando(true)}
              >
                + Importar CSV
              </button>
            )}
          </div>
        </div>
      </div>
      {importando && (
        <ImportCSVModal
          titulo="Importar CSV na lista"
          onClose={() => setImportando(false)}
          onConfirm={importarCSV}
        />
      )}
    </div>
  );
}

export default function Listas() {
  const [listas, setListas] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [modal, setModal] = useState(false);
  const [detalhe, setDetalhe] = useState(null);
  const [finalizando, setFinalizando] = useState(null);
  const [importando, setImportando] = useState(false);
  const [alerta, setAlerta] = useState(null);

  async function carregar() {
    setLoading(true);
    setErro("");
    try {
      const params = status ? `?status=${status}` : "";
      const [ls, ps] = await Promise.all([api.listarListas(params), api.listarProdutos()]);
      setListas(ls);
      setProdutos(ps);
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  async function automatica() {
    try {
      const res = await api.listaAutomatica();
      if (!res.lista) setAlerta({ mensagem: res.mensagem || "Nenhum produto abaixo do mínimo." });
      carregar();
    } catch (err) {
      setErro(err.message);
    }
  }

  async function confirmarFinalizar() {
    try {
      await api.finalizarLista(finalizando.id);
      carregar();
      setDetalhe(null);
      setFinalizando(null);
    } catch (err) {
      setErro(err.message);
    }
  }

  async function remover(id) {
    if (!confirm("Remover esta lista?")) return;
    try {
      await api.removerLista(id);
      carregar();
      setDetalhe(null);
    } catch (err) {
      setErro(err.message);
    }
  }

  async function abrir(id) {
    try {
      setDetalhe(await api.obterLista(id));
    } catch (err) {
      setErro(err.message);
    }
  }

  async function importarLista(itens) {
    const listaItens = itens.map((it) => ({
      nome: it.nome,
      categoria: it.categoria,
      quantidade: it.quantidade,
      precoUnitario: it.valorUnitario,
      validades: it.validade ? [{ data: it.validade, quantidade: it.quantidade }] : [],
    }));
    await api.listaManual({ nome: "Importação CSV", itens: listaItens });
    carregar();
    setImportando(false);
  }

  async function reabrir(id) {
    if (
      !confirm(
        "Reabrir esta lista para edição? O estoque adicionado pela finalização será estornado.",
      )
    )
      return;
    try {
      const atualizada = await api.reabrirLista(id);
      setDetalhe(atualizada);
      carregar();
    } catch (err) {
      setErro(err.message);
    }
  }

  return (
    <div>
      <div className="page-head">
        <h1>Listas de compras</h1>
        <div className="btn-row" style={{ margin: 0 }}>
          <button onClick={automatica}>Gerar automática</button>
          <button className="ghost" onClick={() => setImportando(true)}>
            Importar CSV
          </button>
        </div>
      </div>

      <button className="fab" onClick={() => setModal(true)}>
        +
      </button>

      <div className="filters">
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Todas</option>
          <option value="pendente">Pendentes</option>
          <option value="finalizada">Finalizadas</option>
        </select>
        <button className="ghost" onClick={carregar}>
          Filtrar
        </button>
      </div>

      {erro && <p className="erro">{erro}</p>}

      {loading ? (
        <p className="center">Carregando…</p>
      ) : listas.length === 0 ? (
        <div className="empty">Nenhuma lista de compras.</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Itens</th>
              <th>Status</th>
              <th>Criado por</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {listas.map((l) => (
              <tr key={l.id}>
                <td data-label="Nome">{l.nome}</td>
                <td data-label="Itens">{l.itens.length}</td>
                <td data-label="Status">
                  <span className={`badge ${l.status}`}>{l.status}</span>
                </td>
                <td data-label="Criado por">{l.criadoPor?.nome || "—"}</td>
                <td data-label="Ações">
                  <div className="td-actions">
                    <button className="small ghost" onClick={() => abrir(l.id)}>
                      Ver
                    </button>
                    {l.status === "pendente" && (
                      <>
                        <button className="small" onClick={() => setFinalizando(l)}>
                          Finalizar
                        </button>
                        <button className="small danger" onClick={() => remover(l.id)}>
                          Excluir
                        </button>
                      </>
                    )}
                    {l.status === "finalizada" && (
                      <button className="small" onClick={() => reabrir(l.id)}>
                        Reabrir
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {modal && (
        <ModalManual
          produtos={produtos}
          onClose={() => setModal(false)}
          onSalvar={() => {
            setModal(false);
            carregar();
          }}
        />
      )}

      {importando && (
        <ImportCSVModal
          titulo="Importar CSV na lista"
          onClose={() => setImportando(false)}
          onConfirm={importarLista}
        />
      )}

      {detalhe && !finalizando && (
        <DetalheLista
          lista={detalhe}
          produtos={produtos}
          onClose={() => setDetalhe(null)}
          onChanged={carregar}
          onFinalizar={(l) => {
            setDetalhe(null);
            setFinalizando(l);
          }}
          onReabrir={(l) => reabrir(l.id)}
        />
      )}

      {finalizando && (
        <ModalFinalizar
          lista={finalizando}
          onClose={() => setFinalizando(null)}
          onConfirm={confirmarFinalizar}
        />
      )}

      {alerta && (
        <AlertModal
          titulo="Lista automática"
          mensagem={alerta.mensagem}
          onClose={() => setAlerta(null)}
        />
      )}
    </div>
  );
}
