import { useRef, useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Stage, Layer, Rect, Line, Text, Transformer } from 'react-konva'
import { useDesign } from '../context/DesignContext'
import SaveModal from '../components/SaveModal'
import './Editor2D.css'

function useDark() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))
  const toggle = () => {
    const next = !dark
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('spacio-dark', next ? '1' : '0')
    setDark(next)
  }
  return [dark, toggle]
}

const SCALE = 80
const PAD = 40
const GRID_PX = SCALE / 4   // 20px = 0.25m snap resolution

const LIBRARY = [
  { type: 'Chair', width: 0.6, height: 0.6, defaultColor: '#8B7355', emoji: '🪑' },
  { type: 'Dining Table', width: 1.6, height: 0.9, defaultColor: '#6B4C2A', emoji: '🍽️' },
  { type: 'Sofa', width: 2.0, height: 0.9, defaultColor: '#708090', emoji: '🛋️' },
  { type: 'Bed', width: 2.0, height: 1.6, defaultColor: '#DEB887', emoji: '🛏️' },
  { type: 'Side Table', width: 0.5, height: 0.5, defaultColor: '#A0785A', emoji: '🪵' },
  { type: 'Wardrobe', width: 1.8, height: 0.6, defaultColor: '#5C4033', emoji: '🗄️' },
  { type: 'Desk', width: 1.2, height: 0.6, defaultColor: '#8B8B6B', emoji: '🖥️' },
  { type: 'Bookshelf', width: 1.0, height: 0.3, defaultColor: '#7B6B3A', emoji: '📚' },
]

// ── L-Shape helper ───────────────────────────────────────────
function getLShapeRects(room) {
  const fullW = room.width * SCALE
  const fullH = room.length * SCALE
  const mainH = Math.round(fullH * 0.6)
  const wingH = fullH - mainH
  const wingW = Math.round(fullW * 0.5)
  return [
    { x: PAD, y: PAD, w: fullW, h: mainH },
    { x: PAD, y: PAD + mainH, w: wingW, h: wingH },
  ]
}

// ── Boundary clamp ───────────────────────────────────────────
function clampToRoom(x, y, item, room) {
  const iw = item.width * SCALE * item.scale
  const ih = item.height * SCALE * item.scale

  if (room.shape === 'L-Shape') {
    const [main, wing] = getLShapeRects(room)
    const cy = y + ih / 2
    const rect = cy > main.y + main.h ? wing : main
    return {
      x: Math.max(rect.x, Math.min(x, rect.x + rect.w - iw)),
      y: Math.max(rect.y, Math.min(y, rect.y + rect.h - ih)),
    }
  }

  return {
    x: Math.max(PAD, Math.min(x, PAD + room.width * SCALE - iw)),
    y: Math.max(PAD, Math.min(y, PAD + room.length * SCALE - ih)),
  }
}

// ── Snap helper ──────────────────────────────────────────────
function snapGrid(val) {
  return Math.round(val / GRID_PX) * GRID_PX
}

// ── Measurement line nodes ────────────────────────────────────
function MeasurementLines({ room }) {
  const lines = []
  const tickLen = 6

  // Horizontal ticks along top edge
  for (let m = 0; m <= room.width; m++) {
    const x = PAD + m * SCALE
    lines.push(
      <Line key={`ht-${m}`} points={[x, PAD - 8, x, PAD - 8 - tickLen]}
        stroke="#94a3b8" strokeWidth={1} />,
      <Text key={`hl-${m}`} x={x - 8} y={PAD - 24} text={`${m}m`}
        fontSize={10} fill="#94a3b8" />
    )
  }
  // Horizontal ruler line
  lines.push(
    <Line key="h-ruler" points={[PAD, PAD - 11, PAD + room.width * SCALE, PAD - 11]}
      stroke="#94a3b8" strokeWidth={1} />
  )

  // Vertical ticks along left edge
  for (let m = 0; m <= room.length; m++) {
    const y = PAD + m * SCALE
    lines.push(
      <Line key={`vt-${m}`} points={[PAD - 8, y, PAD - 8 - tickLen, y]}
        stroke="#94a3b8" strokeWidth={1} />,
      <Text key={`vl-${m}`} x={4} y={y - 5} text={`${m}`}
        fontSize={10} fill="#94a3b8" />
    )
  }
  // Vertical ruler line
  lines.push(
    <Line key="v-ruler" points={[PAD - 11, PAD, PAD - 11, PAD + room.length * SCALE]}
      stroke="#94a3b8" strokeWidth={1} />
  )

  return <>{lines}</>
}

// ─────────────────────────────────────────────────────────────
export default function Editor2D() {
  const navigate = useNavigate()
  const {
    room, furniture,
    selectedId, setSelectedId,
    addFurniture, updateFurniture, deleteFurniture,
    commitFurnitureHistory,
    saveDesign,
    undo, redo, canUndo, canRedo,
  } = useDesign()

  const stageRef = useRef()
  const trRef = useRef()
  const [showSave, setShowSave] = useState(false)
  const [snapOn, setSnapOn] = useState(false)
  const [showLabels, setShowLabels] = useState(true)
  const [showGrid, setShowGrid] = useState(true)
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))

  const toggleDark = () => {
    const next = !dark
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('spacio-dark', next ? '1' : '0')
    setDark(next)
  }

  const isLShape = room.shape === 'L-Shape'
  const lRects = isLShape ? getLShapeRects(room) : []
  const cW = room.width * SCALE + PAD * 2
  const cH = room.length * SCALE + PAD * 2
  const selected = furniture.find(f => f.id === selectedId)

  // ── Transformer sync ─────────────────────────────────────────
  useEffect(() => {
    if (!trRef.current) return
    const stage = trRef.current.getStage()
    const node = stage?.findOne('#item-' + selectedId)
    trRef.current.nodes(node ? [node] : [])
  }, [selectedId, furniture])

  // ── Keyboard shortcuts: Undo / Redo ──────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      const meta = e.metaKey || e.ctrlKey
      if (meta && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo() }
      if (meta && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo() }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId && document.activeElement.tagName !== 'INPUT') deleteFurniture(selectedId)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [undo, redo, selectedId, deleteFurniture])

  // ── Drag end: clamp + optional snap + commit history ─────────
  const handleDragEnd = useCallback((item, e) => {
    let x = e.target.x()
    let y = e.target.y()
    if (snapOn) { x = snapGrid(x); y = snapGrid(y) }
    const clamped = clampToRoom(x, y, item, room)
    e.target.position(clamped)
    updateFurniture(item.id, clamped)
    commitFurnitureHistory()
  }, [snapOn, room, updateFurniture, commitFurnitureHistory])

  // ── Property change: commit after slider settles ─────────────
  const handlePropChange = useCallback((id, updates) => {
    updateFurniture(id, updates)
  }, [updateFurniture])

  const handlePropCommit = useCallback(() => {
    commitFurnitureHistory()
  }, [commitFurnitureHistory])

  // ── Export PNG ───────────────────────────────────────────────
  const handleExport = useCallback(() => {
    if (!stageRef.current) return
    const uri = stageRef.current.toDataURL({ mimeType: 'image/png', quality: 1, pixelRatio: 2 })
    const a = document.createElement('a')
    a.href = uri
    a.download = 'spacio-design.png'
    a.click()
  }, [])

  return (
    <div className="editor">
      {/* ── Top Bar ─────────────────────────────────────────── */}
      <div className="editor-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate('/dashboard')} className="btn-topbar">← Dashboard</button>
          <span className="topbar-logo">Spacio</span>
        </div>
        <div className="topbar-title">
          <span>2D Editor</span>
          <span className="room-dims">{room.width}m × {room.length}m{isLShape ? ' · L' : ''}</span>
        </div>
        <div className="topbar-right">
          <button className="sp-dark-toggle" onClick={toggleDark} title="Dark mode">{dark ? '☀️' : '🌙'}</button>
          <button onClick={() => setShowSave(true)} className="btn-save">💾 Save</button>
          <button onClick={() => navigate('/preview3d')} className="btn-3d">🏠 3D</button>
        </div>
      </div>

      {/* ── Tool Strip ──────────────────────────────────────── */}
      <div className="editor-toolstrip">
        <div className="toolstrip-left">
          <button
            className={`tool-btn ${canUndo() ? '' : 'tool-btn--dim'}`}
            onClick={undo}
            title="Undo (Ctrl+Z)"
          >↩ Undo</button>
          <button
            className={`tool-btn ${canRedo() ? '' : 'tool-btn--dim'}`}
            onClick={redo}
            title="Redo (Ctrl+Y)"
          >↪ Redo</button>
        </div>
        <div className="toolstrip-right">
          <button
            className={`tool-btn ${snapOn ? 'tool-btn--active' : ''}`}
            onClick={() => setSnapOn(s => !s)}
            title="Snap to Grid"
          >⊞ Snap {snapOn ? 'ON' : 'OFF'}</button>
          <button
            className={`tool-btn ${showGrid ? 'tool-btn--active' : ''}`}
            onClick={() => setShowGrid(s => !s)}
            title="Toggle Grid"
          >⊟ Grid</button>
          <button
            className={`tool-btn ${showLabels ? 'tool-btn--active' : ''}`}
            onClick={() => setShowLabels(s => !s)}
            title="Toggle Labels"
          >🏷 Labels</button>
          <button
            className="tool-btn"
            onClick={handleExport}
            title="Export as PNG"
          >📤 Export</button>
        </div>
      </div>

      <div className="editor-body">
        {/* ── LEFT: Library ─────────────────────────────────── */}
        <div className="lib-panel">
          <div className="lib-header">
            <h3>Furniture</h3>
            <span>click to add</span>
          </div>
          {LIBRARY.map(item => (
            <button
              key={item.type}
              className="lib-item"
              onClick={() => addFurniture(item)}
            >
              <span className="lib-emoji">{item.emoji}</span>
              <div className="lib-info">
                <span className="lib-name">{item.type}</span>
                <span className="lib-size">{item.width}×{item.height}m</span>
              </div>
            </button>
          ))}
        </div>

        {/* ── CENTRE: Canvas ────────────────────────────────── */}
        <div className="canvas-area" style={{ touchAction: 'none' }}>
          <Stage
            ref={stageRef}
            width={cW}
            height={cH}
            onClick={e => { if (e.target === e.target.getStage()) setSelectedId(null) }}
            style={{ background: 'white', borderRadius: 8, boxShadow: '0 4px 24px rgba(0,0,0,0.15)' }}
          >
            <Layer>
              {/* Floor */}
              {isLShape ? (
                lRects.map((r, i) => (
                  <Rect key={i} x={r.x} y={r.y} width={r.w} height={r.h}
                    fill={room.floorColor} stroke={room.wallColor} strokeWidth={14} />
                ))
              ) : (
                <Rect x={PAD} y={PAD}
                  width={room.width * SCALE} height={room.length * SCALE}
                  fill={room.floorColor} stroke={room.wallColor} strokeWidth={14} />
              )}

              {/* Floor grid overlay */}
              {showGrid && (() => {
                const lines = []
                const steps = Math.round((room.width * SCALE) / GRID_PX)
                const stepsH = Math.round((room.length * SCALE) / GRID_PX)
                for (let i = 1; i < steps; i++) {
                  const x = PAD + i * GRID_PX
                  lines.push(
                    <Line key={`gx-${i}`}
                      points={[x, PAD, x, PAD + room.length * SCALE]}
                      stroke="rgba(0,0,0,0.07)" strokeWidth={1} listening={false} />
                  )
                }
                for (let j = 1; j < stepsH; j++) {
                  const y = PAD + j * GRID_PX
                  lines.push(
                    <Line key={`gy-${j}`}
                      points={[PAD, y, PAD + room.width * SCALE, y]}
                      stroke="rgba(0,0,0,0.07)" strokeWidth={1} listening={false} />
                  )
                }
                return lines
              })()}

              {/* Measurement ruler lines */}
              <MeasurementLines room={room} />

              {/* Furniture */}
              {furniture.map(item => (
                <Rect
                  key={item.id}
                  id={'item-' + item.id}
                  x={item.x} y={item.y}
                  width={item.width * SCALE * item.scale}
                  height={item.height * SCALE * item.scale}
                  fill={item.color}
                  stroke={selectedId === item.id ? '#2563eb' : 'rgba(0,0,0,0.2)'}
                  strokeWidth={selectedId === item.id ? 2.5 : 1}
                  rotation={item.rotation}
                  draggable
                  cornerRadius={4}
                  shadowColor="black"
                  shadowBlur={selectedId === item.id ? 10 : 2}
                  shadowOpacity={0.2}
                  onClick={() => setSelectedId(item.id)}
                  onTap={() => setSelectedId(item.id)}
                  onDragEnd={e => handleDragEnd(item, e)}
                />
              ))}

              {/* Labels */}
              {showLabels && furniture.map(item => (
                <Text
                  key={'lbl-' + item.id}
                  x={item.x + 5} y={item.y + 5}
                  text={item.type}
                  fontSize={11} fill="white"
                  listening={false}
                  rotation={item.rotation}
                />
              ))}

              <Transformer ref={trRef} rotateEnabled boundBoxFunc={(_, n) => n} />
            </Layer>
          </Stage>
        </div>

        {/* ── RIGHT: Properties ─────────────────────────────── */}
        <div className="props-panel">
          <h3>Properties</h3>
          {selected ? (
            <div className="props-content">
              <div className="prop-name">{selected.type}</div>

              <div className="prop-row">
                <label>Colour</label>
                <div className="color-row">
                  <input type="color" value={selected.color}
                    onChange={e => handlePropChange(selectedId, { color: e.target.value })}
                    onBlur={handlePropCommit} />
                  <span>{selected.color}</span>
                </div>
              </div>

              <div className="prop-row">
                <label>Scale — {selected.scale.toFixed(1)}×</label>
                <input type="range" min="0.5" max="2.5" step="0.1"
                  value={selected.scale}
                  onChange={e => handlePropChange(selectedId, { scale: +e.target.value })}
                  onMouseUp={handlePropCommit}
                  onTouchEnd={handlePropCommit} />
              </div>

              <div className="prop-row">
                <label>Rotate — {selected.rotation}°</label>
                <input type="range" min="0" max="355" step="5"
                  value={selected.rotation}
                  onChange={e => handlePropChange(selectedId, { rotation: +e.target.value })}
                  onMouseUp={handlePropCommit}
                  onTouchEnd={handlePropCommit} />
              </div>

              <div className="prop-row">
                <label>Size</label>
                <span className="prop-val">{selected.width}m × {selected.height}m</span>
              </div>

              <button onClick={() => deleteFurniture(selectedId)} className="btn-remove">
                🗑️ Remove Item
              </button>
            </div>
          ) : (
            <div className="no-sel">
              <span>👆</span>
              <p>Click any furniture item to edit its properties</p>
            </div>
          )}
          <div className="item-count">
            📦 {furniture.length} item{furniture.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {showSave && (
        <SaveModal
          onSave={name => { saveDesign(name); setShowSave(false) }}
          onCancel={() => setShowSave(false)}
        />
      )}
    </div>
  )
}