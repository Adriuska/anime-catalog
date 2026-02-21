export default function ConfirmModal({ open, message, onCancel, onConfirm }) {
  if (!open) return null;

  return (
    <>
      <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true">
        <div className="modal-dialog modal-dialog-centered" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Confirmar eliminación</h5>
              <button type="button" className="btn-close" onClick={onCancel}></button>
            </div>
            <div className="modal-body"><p className="mb-0">{message}</p></div>
            <div className="modal-footer">
              <button className="btn btn-secondary" type="button" onClick={onCancel}>Cancelar</button>
              <button className="btn btn-danger" type="button" onClick={onConfirm}>Eliminar</button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show"></div>
    </>
  );
}
