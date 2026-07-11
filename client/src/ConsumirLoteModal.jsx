import { useState } from "react";
import { ListaValidades } from "./ValidadesField.jsx";

export function ConsumirLoteModal({ produto, onClose, onConfirm }) {
  const lotes = Array.isArray(produto.validades)
    ? produto.validades.filter((v) => v.quantidade > 0)
    : [];
  const loteInicial = lotes.length
    ? lotes.sort((a, b) => a.data.localeCompare(b.data))[0].data
    : "";
  const [quantidade, setQuantidade] = useState(1);
  const [validadeData, setValidadeData] = useState(loteInicial);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErro("");
    const qtd = Number(quantidade);
    if (!qtd || qtd <= 0) return setErro("Informe a quantidade");
    if (qtd > produto.quantidade)
      return setErro(`Estoque insuficiente (máx: ${produto.quantidade})`);
    if (validadeData) {
      const lote = lotes.find((v) => v.data === validadeData);
      if (lote && qtd > lote.quantidade)
        return setErro(`Lote tem apenas ${lote.quantidade} unidade(s)`);
    }
    setLoading(true);
    try {
      await onConfirm(produto.id, qtd, validadeData);
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  }

  function consumirTudo() {
    setQuantidade(produto.quantidade);
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
        <h2>Consumir "{produto.nome}"</h2>
        <p className="muted">Estoque atual: {produto.quantidade}</p>
        {lotes.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <p className="muted small" style={{ marginBottom: 4 }}>
              Lotes:
            </p>
            <ListaValidades validades={produto.validades} max={99} />
          </div>
        )}
        {erro && <p className="erro">{erro}</p>}
        <form onSubmit={submit}>
          <label>
            Quantidade
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <input
                type="number"
                min="1"
                max={produto.quantidade}
                step="1"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
                required
                style={{ flex: 1 }}
              />
              <button
                type="button"
                className="small ghost"
                onClick={consumirTudo}
                style={{ whiteSpace: "nowrap" }}
              >
                Tudo
              </button>
            </div>
          </label>
          {lotes.length > 0 && (
            <label>
              Lote
              <select value={validadeData} onChange={(e) => setValidadeData(e.target.value)}>
                {[...lotes]
                  .sort((a, b) => a.data.localeCompare(b.data))
                  .map((v) => (
                    <option key={v.data} value={v.data}>
                      {v.data} — {v.quantidade} unidade(s)
                    </option>
                  ))}
              </select>
            </label>
          )}
          <div className="modal-actions">
            <button type="button" className="ghost" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" disabled={loading}>
              {loading ? "Consumindo…" : "Consumir"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
