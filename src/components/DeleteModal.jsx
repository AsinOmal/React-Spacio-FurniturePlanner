import './Modal.css'

export default function DeleteModal({ name, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <h3>🗑️ Delete Design</h3>
        <div className="modal-body">
          <p>Are you sure you want to delete <strong>'{name}'</strong>?</p>
          <p className="modal-warn">This cannot be undone.</p>
        </div>
        <div className="modal-actions">
          <button onClick={onConfirm} className="btn-danger">Yes, Delete</button>
          <button onClick={onCancel} className="btn-cancel">Cancel</button>
        </div>
      </div>
    </div>
  )
}