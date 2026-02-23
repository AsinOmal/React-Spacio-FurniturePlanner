import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDesign } from '../context/DesignContext'
import './RoomSetup.css'

const SHAPES = ['Rectangle', 'Square', 'L-Shape']

export default function RoomSetup() {
  const navigate = useNavigate()
  const { room, setRoom } = useDesign()
  const [form, setForm] = useState({ ...room })
  const [errors, setErrors] = useState({})

  const validate = () => {
    const errs = {}
    if (!form.width || form.width < 1 || form.width > 20)
      errs.width = 'Must be between 1 – 20 metres'
    if (!form.length || form.length < 1 || form.length > 20)
      errs.length = 'Must be between 1 – 20 metres'
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

  const previewW = Math.min(form.width * 36, 280)
  const previewH = Math.min(form.length * 36, 200)

  return (
    <div className="rs-page">
      {/* ── Nav ── */}
      <nav className="sp-nav">
        <span className="sp-nav-logo">Spacio</span>
        <button className="sp-btn sp-btn-ghost" onClick={() => navigate('/dashboard')}>
          ← Dashboard
        </button>
      </nav>

      <main className="rs-main">
        <div className="rs-card">
          {/* Header */}
          <div className="rs-header">
            <h1 className="rs-title">Configure your room</h1>
            <p className="rs-sub">Set dimensions, shape, and finishes before you start designing.</p>
          </div>

          <form onSubmit={handleSubmit} className="rs-form">
            {/* Dimensions */}
            <div className="rs-section-label">Dimensions</div>
            <div className="rs-row">
              <div className="rs-field">
                <label>Width (metres)</label>
                <input
                  type="number"
                  className={errors.width ? 'rs-input rs-input--err' : 'rs-input'}
                  value={form.width}
                  onChange={e => update('width', parseFloat(e.target.value))}
                  min="1" max="20" step="0.5"
                />
                {errors.width && <span className="rs-error">{errors.width}</span>}
              </div>
              <div className="rs-field">
                <label>Length (metres)</label>
                <input
                  type="number"
                  className={errors.length ? 'rs-input rs-input--err' : 'rs-input'}
                  value={form.length}
                  onChange={e => update('length', parseFloat(e.target.value))}
                  min="1" max="20" step="0.5"
                />
                {errors.length && <span className="rs-error">{errors.length}</span>}
              </div>
            </div>

            {/* Shape */}
            <div className="rs-section-label" style={{ marginTop: 20 }}>Shape</div>
            <div className="rs-shape-row">
              {SHAPES.map(s => (
                <button
                  type="button" key={s}
                  className={`rs-shape-btn ${form.shape === s ? 'rs-shape-btn--active' : ''}`}
                  onClick={() => update('shape', s)}
                >
                  <span className="rs-shape-icon">
                    {s === 'Rectangle' ? '▬' : s === 'Square' ? '■' : '⌐'}
                  </span>
                  <span>{s}</span>
                </button>
              ))}
            </div>

            {/* Colours */}
            <div className="rs-section-label" style={{ marginTop: 20 }}>Finishes</div>
            <div className="rs-row">
              <div className="rs-field">
                <label>Wall colour</label>
                <div className="rs-color">
                  <input type="color" value={form.wallColor}
                    onChange={e => update('wallColor', e.target.value)} />
                  <span>{form.wallColor}</span>
                </div>
              </div>
              <div className="rs-field">
                <label>Floor colour</label>
                <div className="rs-color">
                  <input type="color" value={form.floorColor}
                    onChange={e => update('floorColor', e.target.value)} />
                  <span>{form.floorColor}</span>
                </div>
              </div>
            </div>

            {/* Live preview */}
            <div className="rs-preview">
              <div className="rs-preview-label">Live preview</div>
              <div className="rs-preview-area">
                <div
                  className="rs-preview-box"
                  style={{
                    background: form.floorColor,
                    border: `10px solid ${form.wallColor}`,
                    width: `${previewW}px`,
                    height: `${previewH}px`,
                  }}
                >
                  <span>{form.width}m × {form.length}m</span>
                </div>
              </div>
            </div>

            <button type="submit" className="sp-btn sp-btn-primary rs-submit">
              Continue to Editor →
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}