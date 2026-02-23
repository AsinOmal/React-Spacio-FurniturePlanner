import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDesign } from '../context/DesignContext'
import DeleteModal from '../components/DeleteModal'
import './Dashboard.css'

function useDark() {
  const [dark, setDark] = useState(() => localStorage.getItem('spacio-dark') === '1')
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('spacio-dark', dark ? '1' : '0')
  }, [dark])
  return [dark, setDark]
}

// Tiny canvas snapshot thumbnail
function DesignThumbnail({ design }) {
  const { room, furniture } = design
  const SCALE = 4          // px per 0.1m
  const PAD = 4
  const W = room.width * SCALE * 10 + PAD * 2
  const H = room.length * SCALE * 10 + PAD * 2
  return (
    <svg
      width={W} height={H}
      viewBox={`0 0 ${W} ${H}`}
      style={{ borderRadius: 6, display: 'block', maxWidth: '100%', maxHeight: '100%' }}
    >
      <rect x={PAD} y={PAD}
        width={room.width * SCALE * 10} height={room.length * SCALE * 10}
        fill={room.floorColor} stroke={room.wallColor} strokeWidth={PAD} rx={2} />
      {furniture.map(f => (
        <rect
          key={f.id}
          x={PAD + (f.x - 40) / 80 * SCALE * 10}
          y={PAD + (f.y - 40) / 80 * SCALE * 10}
          width={f.width * f.scale * SCALE * 10}
          height={f.height * f.scale * SCALE * 10}
          fill={f.color}
          rx={1}
          opacity={0.9}
          transform={`rotate(${f.rotation},${PAD + (f.x - 40) / 80 * SCALE * 10 + f.width * f.scale * SCALE * 5},${PAD + (f.y - 40) / 80 * SCALE * 10 + f.height * f.scale * SCALE * 5})`}
        />
      ))}
    </svg>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { savedDesigns, loadDesign, deleteDesign, setRoom, setFurniture } = useDesign()
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [dark, setDark] = useDark()

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn')
    navigate('/')
  }

  const handleNew = () => {
    setRoom({ width: 4, length: 3, shape: 'Rectangle', wallColor: '#F5F5DC', floorColor: '#D2B48C' })
    setFurniture([])
    navigate('/room-setup')
  }

  const handleEdit = (design) => {
    loadDesign(design)
    navigate('/editor')
  }

  const handleDeleteConfirm = () => {
    deleteDesign(deleteTarget.id)
    setDeleteTarget(null)
  }

  const totalItems = savedDesigns.reduce((s, d) => s + d.furniture.length, 0)

  return (
    <div className="db-page">
      {/* ── Nav ── */}
      <nav className="sp-nav">
        <span className="sp-nav-logo">Spacio</span>
        <div className="sp-nav-right">
          <button
            className="sp-dark-toggle"
            onClick={() => setDark(d => !d)}
            title="Toggle dark mode"
          >{dark ? '☀️' : '🌙'}</button>
          <button className="sp-btn sp-btn-ghost" onClick={handleLogout}>Log Out</button>
        </div>
      </nav>

      {/* ── Body ── */}
      <main className="db-main">

        {/* ── Hero row ── */}
        <div className="db-hero">
          <div>
            <h1 className="db-hero-title">Your Designs</h1>
            <p className="db-hero-sub">
              {savedDesigns.length === 0
                ? 'Nothing here yet — start your first design below.'
                : `${savedDesigns.length} design${savedDesigns.length !== 1 ? 's' : ''} · ${totalItems} total item${totalItems !== 1 ? 's' : ''}`}
            </p>
          </div>
          <button className="sp-btn sp-btn-primary db-new-btn" onClick={handleNew}>
            + New Design
          </button>
        </div>

        {/* ── Stats row ── */}
        <div className="db-stats">
          <div className="db-stat">
            <span className="db-stat-num">{savedDesigns.length}</span>
            <span className="db-stat-label">Saved Designs</span>
          </div>
          <div className="db-stat">
            <span className="db-stat-num">{totalItems}</span>
            <span className="db-stat-label">Furniture Items</span>
          </div>
          <div className="db-stat">
            <span className="db-stat-num">
              {savedDesigns.length > 0
                ? `${Math.max(...savedDesigns.map(d => d.room.width))}×${Math.max(...savedDesigns.map(d => d.room.length))}m`
                : '—'}
            </span>
            <span className="db-stat-label">Largest Room</span>
          </div>
        </div>

        {/* ── Design grid ── */}
        {savedDesigns.length === 0 ? (
          <div className="db-empty">
            <div className="db-empty-icon">📐</div>
            <h2>No designs yet</h2>
            <p>Click <strong>+ New Design</strong> to configure a room and start placing furniture.</p>
            <button className="sp-btn sp-btn-accent" onClick={handleNew} style={{ marginTop: 20 }}>
              Start Designing
            </button>
          </div>
        ) : (
          <div className="db-grid">
            {savedDesigns.map(design => (
              <div key={design.id} className="db-card">
                <div className="db-card-thumb">
                  <DesignThumbnail design={design} />
                </div>
                <div className="db-card-body">
                  <h3 className="db-card-name">{design.name}</h3>
                  <p className="db-card-meta">
                    {design.room.width}m × {design.room.length}m · {design.room.shape}
                  </p>
                  <p className="db-card-meta">
                    {design.furniture.length} item{design.furniture.length !== 1 ? 's' : ''}
                    {design.createdAt && ` · ${new Date(design.createdAt).toLocaleDateString()}`}
                  </p>
                </div>
                <div className="db-card-actions">
                  <button className="sp-btn sp-btn-ghost db-btn-edit"
                    onClick={() => handleEdit(design)}>
                    ✏️ Edit
                  </button>
                  <button className="sp-btn sp-btn-danger db-btn-del"
                    onClick={() => setDeleteTarget(design)}>
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {deleteTarget && (
        <DeleteModal
          name={deleteTarget.name}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}