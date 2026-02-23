import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDesign } from '../context/DesignContext'
import DeleteModal from '../components/DeleteModal'
import './Dashboard.css'

function useDark() {
  const [dark, setDark] = useState(() => localStorage.getItem('spacio-dark') === '1')
  const toggle = () => {
    const next = !dark
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('spacio-dark', next ? '1' : '0')
    setDark(next)
  }
  return [dark, toggle]
}

function DesignThumbnail({ design }) {
  const { room, furniture } = design
  const S = 36, PAD = 6
  const W = room.width * S + PAD * 2
  const H = room.length * S + PAD * 2
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}
      style={{ display: 'block', width: '100%', height: '100%' }}>
      <rect x={PAD} y={PAD}
        width={room.width * S} height={room.length * S}
        fill={room.floorColor} stroke={room.wallColor} strokeWidth={5} rx={3} />
      {furniture.map(f => {
        const fx = PAD + (f.x - 40) / 80 * S
        const fy = PAD + (f.y - 40) / 80 * S
        const fw = f.width * f.scale * S
        const fh = f.height * f.scale * S
        return (
          <rect key={f.id}
            x={fx} y={fy} width={fw} height={fh}
            fill={f.color} rx={2} opacity={0.88}
            transform={`rotate(${f.rotation},${fx + fw / 2},${fy + fh / 2})`}
          />
        )
      })}
    </svg>
  )
}

const SHAPE_ICON = { Rectangle: '▬', Square: '■', 'L-Shape': '⌐' }

export default function Dashboard() {
  const navigate = useNavigate()
  const { savedDesigns, loadDesign, deleteDesign, setRoom, setFurniture } = useDesign()
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [dark, toggleDark] = useDark()

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
  const largest = savedDesigns.length > 0
    ? savedDesigns.reduce((max, d) => (d.room.width * d.room.length > max.room.width * max.room.length ? d : max))
    : null

  return (
    <div className="db-root">

      {/* ── Sidebar ── */}
      <aside className="db-sidebar">
        <div className="db-sidebar-top">
          <span className="db-logo">Spacio</span>
          <nav className="db-nav">
            <button className="db-nav-item db-nav-active">
              <span className="db-nav-icon">🗂️</span> My Designs
            </button>
            <button className="db-nav-item" onClick={() => navigate('/')}>
              <span className="db-nav-icon">🏠</span> Home
            </button>
          </nav>
        </div>

        <div className="db-sidebar-bottom">
          <button className="db-side-btn" onClick={toggleDark} title="Toggle dark mode">
            {dark ? '☀️  Light Mode' : '🌙  Dark Mode'}
          </button>
          <button className="db-side-btn db-side-logout" onClick={handleLogout}>
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="db-main">

        {/* ── Top bar ── */}
        <header className="db-topbar">
          <div>
            <h1 className="db-title">My Designs</h1>
            <p className="db-sub">
              {savedDesigns.length === 0
                ? 'Start your first room design'
                : `${savedDesigns.length} design${savedDesigns.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <button className="db-new-btn" onClick={handleNew}>
            + New Design
          </button>
        </header>

        {/* ── Stats strip ── */}
        {savedDesigns.length > 0 && (
          <div className="db-stats">
            <div className="db-stat">
              <span className="db-stat-n">{savedDesigns.length}</span>
              <span className="db-stat-l">Designs</span>
            </div>
            <div className="db-stat-div" />
            <div className="db-stat">
              <span className="db-stat-n">{totalItems}</span>
              <span className="db-stat-l">Furniture Items</span>
            </div>
            <div className="db-stat-div" />
            <div className="db-stat">
              <span className="db-stat-n">
                {largest ? `${largest.room.width}×${largest.room.length}m` : '—'}
              </span>
              <span className="db-stat-l">Largest Room</span>
            </div>
          </div>
        )}

        {/* ── Grid / Empty ── */}
        {savedDesigns.length === 0 ? (
          <div className="db-empty">
            <div className="db-empty-icon">📐</div>
            <h2 className="db-empty-title">No designs yet</h2>
            <p className="db-empty-sub">
              Configure a room and start placing furniture — it takes less than a minute.
            </p>
            <button className="db-new-btn" onClick={handleNew} style={{ marginTop: 24 }}>
              Start your first design
            </button>
          </div>
        ) : (
          <div className="db-grid">
            {savedDesigns.map(design => (
              <article key={design.id} className="db-card">
                {/* Thumbnail */}
                <div className="db-thumb">
                  <DesignThumbnail design={design} />
                </div>

                {/* Info */}
                <div className="db-card-body">
                  <div className="db-card-row">
                    <h3 className="db-card-name">{design.name}</h3>
                    <span className="db-card-shape">
                      {SHAPE_ICON[design.room.shape]} {design.room.shape}
                    </span>
                  </div>
                  <div className="db-card-meta">
                    <span>{design.room.width}m × {design.room.length}m</span>
                    <span className="db-dot">·</span>
                    <span>{design.furniture.length} item{design.furniture.length !== 1 ? 's' : ''}</span>
                    {design.createdAt && (
                      <>
                        <span className="db-dot">·</span>
                        <span>{new Date(design.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="db-card-actions">
                  <button className="db-act-btn db-act-edit" onClick={() => handleEdit(design)}>
                    Open Editor
                  </button>
                  <button className="db-act-btn db-act-del" onClick={() => setDeleteTarget(design)}
                    title="Delete">
                    🗑️
                  </button>
                </div>
              </article>
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