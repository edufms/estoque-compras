export default function ConfirmModal({ aberto, titulo, mensagem, btnConfirmar, btnCancelar, onConfirmar, onCancelar }) {
  if (!aberto) return null;
  return (
    <div className="modal-overlay" onClick={onCancelar}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
        <div className="modal-header">
          <h2>{titulo}</h2>
          <button className="modal-fechar" onClick={onCancelar}>✕</button>
        </div>
        <p style={{ margin: "1rem 0", color: "var(--muted)" }}>{mensagem}</p>
        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
          <button className="btn btn-outline" onClick={onCancelar}>{btnCancelar || "Cancelar"}</button>
          <button className="btn btn-danger" onClick={onConfirmar}>{btnConfirmar || "Confirmar"}</button>
        </div>
      </div>
    </div>
  );
}
