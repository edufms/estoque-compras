import { useState } from "react";

export function normalizarData(valor) {
  if (!valor) return "";
  const v = String(valor).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  const m = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (m) {
    let [, d, mo, y] = m;
    if (y.length === 2) y = `20${y}`;
    const dt = new Date(Number(y), Number(mo) - 1, Number(d));
    if (!Number.isNaN(dt.getTime())) return dt.toISOString().slice(0, 10);
  }
  const dt = new Date(v);
  if (!Number.isNaN(dt.getTime())) return dt.toISOString().slice(0, 10);
  return "";
}

export function parseCSVImport(text) {
  const linhas = String(text)
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const resultado = [];
  for (const linha of linhas) {
    const partes = parseLinha(linha).map((p) => p.trim());
    if (partes.length < 2 || !partes[0]) continue;
    const [nome, quantidade, categoria, validade, valorUnitario] = partes;
    resultado.push({
      nome,
      quantidade: Number(quantidade) || 0,
      categoria: categoria || "",
      validade: normalizarData(validade),
      valorUnitario: Number(valorUnitario) || 0,
    });
  }
  return resultado;
}

function parseLinha(linha) {
  const out = [];
  let atual = "";
  let aspas = false;
  for (let i = 0; i < linha.length; i++) {
    const c = linha[i];
    if (aspas) {
      if (c === '"') {
        if (linha[i + 1] === '"') {
          atual += '"';
          i++;
        } else {
          aspas = false;
        }
      } else {
        atual += c;
      }
    } else if (c === '"') {
      aspas = true;
    } else if (c === ",") {
      out.push(atual);
      atual = "";
    } else {
      atual += c;
    }
  }
  out.push(atual);
  return out;
}

export function ImportCSVModal({ titulo, onClose, onConfirm }) {
  const [texto, setTexto] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  function aoArquivo(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setTexto(String(reader.result || ""));
    reader.readAsText(file);
  }

  async function confirmar(ev) {
    ev.preventDefault();
    setErro("");
    if (!texto.trim()) return setErro("Cole ou importe um arquivo CSV");
    let itens;
    try {
      itens = parseCSVImport(texto);
    } catch (err) {
      return setErro(err.message);
    }
    if (itens.length === 0) return setErro("Nenhum item válido encontrado no CSV");
    setLoading(true);
    try {
      await onConfirm(itens);
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{titulo}</h2>
        <p className="muted">Formato: produto,quantidade,categoria,validade,valor_unitario</p>
        <p className="muted small">Ex.: Carne Moída,2,Carnes,2026-12-31,29.90</p>
        {erro && <p className="erro">{erro}</p>}
        <form onSubmit={confirmar}>
          <label>
            Colar CSV
            <textarea
              rows={8}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder={"produto,quantidade,categoria,validade,valor_unitario"}
            />
          </label>
          <label className="muted small" style={{ display: "block", margin: "8px 0 4px" }}>
            ou importar arquivo .csv
          </label>
          <input type="file" accept=".csv,text/csv" onChange={aoArquivo} />
          <div className="modal-actions">
            <button type="button" className="ghost" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" disabled={loading}>
              {loading ? "Importando…" : "Importar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
