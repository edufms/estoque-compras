import { Fragment } from "react";

function formatar(d) {
  if (!d) return "";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return String(d);
  return dt.toLocaleDateString("pt-BR");
}

export function proximaValidade(validades) {
  const datas = (Array.isArray(validades) ? validades : [])
    .map((v) => new Date(v?.data || v))
    .filter((d) => !Number.isNaN(d.getTime()))
    .sort((a, b) => a - b);
  return datas.length ? datas[0] : null;
}

export function statusValidade(validades) {
  const prox = proximaValidade(validades);
  if (!prox) return "";
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const diffDias = Math.round((prox - hoje) / 86400000);
  if (diffDias < 0) return "vencido";
  if (diffDias <= 7) return "proximo";
  return "ok";
}

export function ValidadesField({ value, onChange, quantidadeTotal = 0, label = "Validades" }) {
  const datas = Array.isArray(value) ? value : [];
  const total = Number(quantidadeTotal) || 0;
  const alocado = datas.reduce((s, v) => s + (Number(v.quantidade) || 0), 0);
  const restante = Math.max(0, total - alocado);

  function add() {
    onChange([...datas, { data: "", quantidade: 0 }]);
  }

  function update(i, campo, v) {
    if (campo === "quantidade") {
      const num = Number(v) || 0;
      const outras = datas.reduce(
        (s, d, idx) => (idx === i ? s : s + (Number(d.quantidade) || 0)),
        0,
      );
      const maxima = total - outras;
      const clamped = Math.max(0, Math.min(num, maxima));
      onChange(datas.map((d, idx) => (idx === i ? { ...d, quantidade: clamped } : d)));
    } else {
      onChange(datas.map((d, idx) => (idx === i ? { ...d, [campo]: v } : d)));
    }
  }

  function remover(i) {
    onChange(datas.filter((_, idx) => idx !== i));
  }

  return (
    <div className="validades-field">
      <span className="muted">{label}</span>
      {datas.map((d, i) => (
        <div key={i} style={{ display: "flex", gap: 8, margin: "6px 0", alignItems: "flex-end" }}>
          <label style={{ flex: 1 }}>
            Data
            <input
              type="date"
              value={d.data || ""}
              onChange={(e) => update(i, "data", e.target.value)}
            />
          </label>
          <label style={{ width: 110 }}>
            Qtd.
            <input
              type="number"
              min="0"
              step="0.001"
              value={d.quantidade}
              onChange={(e) => update(i, "quantidade", e.target.value)}
            />
          </label>
          <button
            type="button"
            className="small danger"
            onClick={() => remover(i)}
            aria-label="Remover validade"
          >
            ✕
          </button>
        </div>
      ))}
      <button type="button" className="ghost small" onClick={add}>
        + Validade
      </button>
      {total > 0 && (
        <p className="muted small">
          {alocado} de {total} alocado(s) · restante: {restante}
        </p>
      )}
    </div>
  );
}

export function ListaValidades({ validades, max = 3 }) {
  const datas = (Array.isArray(validades) ? validades : [])
    .map((v) => ({ data: new Date(v?.data || v), quantidade: Number(v.quantidade) || 0 }))
    .filter((d) => !Number.isNaN(d.data.getTime()))
    .sort((a, b) => a.data - b.data);
  if (datas.length === 0) return <span className="muted">—</span>;
  const mostrar = datas.slice(0, max);
  return (
    <Fragment>
      {mostrar.map((d, i) => (
        <span key={i} className={`validade-tag ${statusValidade([d.data])}`}>
          {formatar(d.data)} ({d.quantidade})
        </span>
      ))}
      {datas.length > max && <span className="muted"> +{datas.length - max}</span>}
    </Fragment>
  );
}

export { formatar };
