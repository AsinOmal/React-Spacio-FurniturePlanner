import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDesign } from '../context/DesignContext'
import DeleteModal from '../components/DeleteModal'
import './Dashboard.css'

export default function Dashboard() {
  const navigate = useNavigate()
  const { savedDesigns, loadDesign, deleteDesign, setRoom, setFurniture } = useDesign()
  const [deleteTarget, setDeleteTarget] = useState(null)

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

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <span className="logo-icon">🛋️</span>
          <h1>Furniture Planner</h1>
        </div>
        <button onClick={handleLogout} className="btn-logout">Log Out</button>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-grid">
          <div className="panel">
            <h2>Saved Designs</h2>
            {savedDesigns.length === 0 ? (
              <div className="empty-state">
                <span>📐</span>
                <p>No saved designs yet.</p>
                <p>Create your first design to get started!</p>
              </div>
            ) : (
              <div className="design-list">
                {savedDesigns.map(design => (
                  <div key={design.id} className="design-item">
                    <div
                      className="design-preview"
                      style={{ background: design.room.floorColor, border: `4px solid ${design.room.wallColor}` }}
                    />
                    <div className="design-info">
                      <h3>{design.name}</h3>
                      <p>{design.room.width}m × {design.room.length}m · {design.furniture.length} items</p>
                    </div>
                    <div className="design-actions">
                      <button onClick={() => handleEdit(design)} className="btn-edit">Edit</button>
                      <button onClick={() => setDeleteTarget(design)} className="btn-delete">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="panel side-panel">
            <h2>Manage Designs</h2>
            <div className="manage-buttons">
              <button onClick={handleNew} className="btn-new">+ New Design</button>
              <div className="stats-box">
                <div className="stat">
                  <span className="stat-num">{savedDesigns.length}</span>
                  <span className="stat-label">Total Designs</span>
                </div>
                <div className="stat">
                  <span className="stat-num">
                    {savedDesigns.reduce((sum, d) => sum + d.furniture.length, 0)}
                  </span>
                  <span className="stat-label">Total Items</span>
                </div>
              </div>
            </div>
          </div>
        </div>
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