export function AlertModal({ titulo, mensagem, onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
        <h2>{titulo}</h2>
        <p style={{ whiteSpace: "pre-wrap" }}>{mensagem}</p>
        <div className="modal-actions">
          <button onClick={onClose}>OK</button>
        </div>
      </div>
    </div>
  );
}
