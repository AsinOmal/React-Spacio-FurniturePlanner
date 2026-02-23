import { useState } from 'react'
import './Modal.css'

export default function SaveModal({ onSave, onCancel }) {
  const [name, setName] = useState('')
  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <h3>💾 Save Design</h3>
        <div className="modal-body">
          <label>Design Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Customer Room A"
            autoFocus
            onKeyDown={e => e.key === 'Enter' && name.trim() && onSave(name.trim())}
          />
        </div>
        <div className="modal-actions">
          <button
            onClick={() => onSave(name.trim())}
            className="btn-confirm"
            disabled={!name.trim()}
          >Save</button>
          <button onClick={onCancel} className="btn-cancel">Cancel</button>
        </div>
      </div>
    </div>
  )
}