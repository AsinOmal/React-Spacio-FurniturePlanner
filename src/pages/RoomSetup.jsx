import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDesign } from '../context/DesignContext'
import './RoomSetup.css'

export default function RoomSetup() {
  const navigate = useNavigate()
  const { room, setRoom } = useDesign()
  const [form, setForm] = useState({ ...room })
  const [errors, setErrors] = useState({})

  const validate = () => {
    const errs = {}
    if (!form.width || form.width < 1 || form.width > 20)
      errs.width = 'Width must be between 1 and 20 metres'
    if (!form.length || form.length < 1 || form.length > 20)
      errs.length = 'Length must be between 1 and 20 metres'
    return errs
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setRoom(form)
    navigate('/editor')
  }

  const update = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: null }))
  }

  const previewW = Math.min(form.width * 40, 300)
  const previewH = Math.min(form.length * 40, 220)

  return (
    <div className="roomsetup">
      <header className="page-header">
        <button onClick={() => navigate('/dashboard')} className="btn-back">← Back</button>
        <h1>Room Setup</h1>
      </header>
      <main className="roomsetup-main">
        <div className="setup-card">
          <h2>Configure Your Room</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Width (metres)</label>
                <input
                  type="number"
                  value={form.width}
                  onChange={e => update('width', parseFloat(e.target.value))}
                  min="1" max="20" step="0.5"
                />
                {errors.width && <span className="field-error">{errors.width}</span>}
              </div>
              <div className="form-group">
                <label>Length (metres)</label>
                <input
                  type="number"
                  value={form.length}
                  onChange={e => update('length', parseFloat(e.target.value))}
                  min="1" max="20" step="0.5"
                />
                {errors.length && <span className="field-error">{errors.length}</span>}
              </div>
            </div>

            <div className="form-group">
              <label>Room Shape</label>
              <select value={form.shape} onChange={e => update('shape', e.target.value)}>
                <option>Rectangle</option>
                <option>Square</option>
                <option>L-Shape</option>
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Wall Colour</label>
                <div className="color-input">
                  <input type="color" value={form.wallColor}
                    onChange={e => update('wallColor', e.target.value)} />
                  <span>{form.wallColor}</span>
                </div>
              </div>
              <div className="form-group">
                <label>Floor Colour</label>
                <div className="color-input">
                  <input type="color" value={form.floorColor}
                    onChange={e => update('floorColor', e.target.value)} />
                  <span>{form.floorColor}</span>
                </div>
              </div>
            </div>

            <div className="room-preview">
              <p>Live Preview</p>
              <div className="preview-area">
                <div
                  className="preview-box"
                  style={{
                    background: form.floorColor,
                    border: `10px solid ${form.wallColor}`,
                    width: `${previewW}px`,
                    height: `${previewH}px`
                  }}
                >
                  <span>{form.width}m × {form.length}m</span>
                </div>
              </div>
            </div>

            <button type="submit" className="btn-continue">
              Continue to Editor →
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}