export function ConfirmModal({ titulo, mensagem, onConfirm, onCancel }) {
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
        <h2>{titulo}</h2>
        <p style={{ whiteSpace: "pre-wrap" }}>{mensagem}</p>
        <div className="modal-actions">
          <button type="button" className="ghost" onClick={onCancel}>
            Cancelar
          </button>
          <button type="button" className="danger" onClick={onConfirm}>
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
