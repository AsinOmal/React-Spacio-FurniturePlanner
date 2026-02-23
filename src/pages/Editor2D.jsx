import { useRef, useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Stage, Layer, Rect, Line, Text, Transformer } from 'react-konva'
import { useDesign } from '../context/DesignContext'
import SaveModal from '../components/SaveModal'
import {
  ArrowLeft, Sun, Moon, Save, Box,
  Undo2, Redo2, Maximize, Grid3x3, Tags, Download,
  Trash2, Pointer, Package
} from 'lucide-react'
import './Editor2D.css'

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

// ── Boundary clamp (rotation-aware) ─────────────────────────
function clampToRoom(x, y, item, room) {
  const iw = item.width * SCALE * item.scale
  const ih = item.height * SCALE * item.scale
  const rad = (item.rotation || 0) * Math.PI / 180

  // 4 corners relative to (0,0) of the item
  const corners = [
    { cx: 0, cy: 0 },
    { cx: iw, cy: 0 },
    { cx: iw, cy: ih },
    { cx: 0, cy: ih }
  ]

  let minX = 0, maxX = 0, minY = 0, maxY = 0
  corners.forEach(p => {
    const rx = p.cx * Math.cos(rad) - p.cy * Math.sin(rad)
    const ry = p.cx * Math.sin(rad) + p.cy * Math.cos(rad)
    if (rx < minX) minX = rx
    if (rx > maxX) maxX = rx
    if (ry < minY) minY = ry
    if (ry > maxY) maxY = ry
  })

  // The item's true bounding box spans [x + minX, x + maxX] and [y + minY, y + maxY]
  if (room.shape === 'L-Shape') {
    const [main, wing] = getLShapeRects(room)
    const itemCenterY = y + ih / 2
    const rect = itemCenterY > main.y + main.h ? wing : main
    const cx = Math.max(rect.x - minX, Math.min(x, rect.x + rect.w - maxX))
    const cy = Math.max(rect.y - minY, Math.min(y, rect.y + rect.h - maxY))
    return { x: cx, y: cy }
  }

  return {
    x: Math.max(PAD - minX, Math.min(x, PAD + room.width * SCALE - maxX)),
    y: Math.max(PAD - minY, Math.min(y, PAD + room.length * SCALE - maxY)),
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

  // Dynamic ruler color — visible on both light and dark
  const rulerColor = 'rgba(150,150,150,0.8)'

  // Horizontal ticks along top edge
  for (let m = 0; m <= room.width; m++) {
    const x = PAD + m * SCALE
    lines.push(
      <Line key={`ht-${m}`} points={[x, PAD - 8, x, PAD - 8 - tickLen]}
        stroke={rulerColor} strokeWidth={1} />,
      <Text key={`hl-${m}`} x={x - 8} y={PAD - 24} text={`${m}m`}
        fontSize={10} fill={rulerColor} />
    )
  }
  // Horizontal ruler line
  lines.push(
    <Line key="h-ruler" points={[PAD, PAD - 11, PAD + room.width * SCALE, PAD - 11]}
      stroke={rulerColor} strokeWidth={1} />
  )

  // Vertical ticks along left edge
  for (let m = 0; m <= room.length; m++) {
    const y = PAD + m * SCALE
    lines.push(
      <Line key={`vt-${m}`} points={[PAD - 8, y, PAD - 8 - tickLen, y]}
        stroke={rulerColor} strokeWidth={1} />,
      <Text key={`vl-${m}`} x={4} y={y - 5} text={`${m}`}
        fontSize={10} fill={rulerColor} />
    )
  }
  // Vertical ruler line
  lines.push(
    <Line key="v-ruler" points={[PAD - 11, PAD, PAD - 11, PAD + room.length * SCALE]}
      stroke={rulerColor} strokeWidth={1} />
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
  const containerRef = useRef()
  const [showSave, setShowSave] = useState(false)
  const [snapOn, setSnapOn] = useState(false)
  const [showLabels, setShowLabels] = useState(true)
  const [showGrid, setShowGrid] = useState(true)
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))
  const [stageScale, setStageScale] = useState(1.4)
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 })
  const [containerSize, setContainerSize] = useState({ w: 800, h: 600 })
  const ZOOM_MIN = 0.4, ZOOM_MAX = 3, ZOOM_STEP = 1.12

  const canvasWidth = room.width * SCALE + PAD * 2
  const canvasHeight = room.length * SCALE + PAD * 2

  // Auto-fit to screen on load
  useEffect(() => {
    if (!containerRef.current) return
    const fitScreen = () => {
      const parentW = containerRef.current.offsetWidth
      const parentH = containerRef.current.offsetHeight
      // Leave 56px padding on all sides around the floor plan
      const availW = parentW - 112
      const availH = parentH - 112

      const scaleX = availW / canvasWidth
      const scaleY = availH / canvasHeight
      // Fit to the most constrained dimension
      const bestScale = Math.min(scaleX, scaleY, ZOOM_MAX)

      setStageScale(bestScale)
      // Center it
      setStagePos({
        x: (availW - canvasWidth * bestScale) / 2 + 56,
        y: (availH - canvasHeight * bestScale) / 2 + 56
      })

      setContainerSize({ w: parentW, h: parentH })
    }
    fitScreen()
    window.addEventListener('resize', fitScreen)
    return () => window.removeEventListener('resize', fitScreen)
  }, [canvasWidth, canvasHeight])

  const toggleDark = () => {
    const next = !dark
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('spacio-dark', next ? '1' : '0')
    setDark(next)
  }

  const isLShape = room.shape === 'L-Shape'
  const lRects = isLShape ? getLShapeRects(room) : []
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

  // ── Zoom (scroll wheel) ────────────────────────────
  const handleWheel = useCallback((e) => {
    e.evt.preventDefault()
    const stage = stageRef.current
    const oldScale = stage.scaleX()
    const pointer = stage.getPointerPosition()
    const direction = e.evt.deltaY < 0 ? 1 : -1
    const newScale = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, oldScale * (direction > 0 ? ZOOM_STEP : 1 / ZOOM_STEP)))
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    }
    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    }
    setStageScale(newScale)
    setStagePos(newPos)
  }, [])

  const resetZoom = useCallback(() => {
    setStageScale(1)
    setStagePos({ x: 0, y: 0 })
  }, [])

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
          <button onClick={() => navigate('/dashboard')} className="btn-topbar">
            <ArrowLeft size={16} /> Dashboard
          </button>
          <span className="topbar-logo">Spacio</span>
        </div>
        <div className="topbar-title">
          <span>2D Editor</span>
          <span className="room-dims">{room.width}m × {room.length}m{isLShape ? ' · L' : ''}</span>
        </div>
        <div className="topbar-right">
          <button className="sp-dark-toggle" onClick={toggleDark} title="Dark mode">
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button onClick={() => setShowSave(true)} className="btn-save">
            <Save size={15} /> Save
          </button>
          <button onClick={() => navigate('/preview3d')} className="btn-3d">
            <Box size={15} /> 3D
          </button>
        </div>
      </div>

      {/* ── Tool Strip ──────────────────────────────────────── */}
      <div className="editor-toolstrip">
        <div className="toolstrip-left">
          <button
            className={`tool-btn ${canUndo() ? '' : 'tool-btn--dim'}`}
            onClick={undo}
            title="Undo (Ctrl+Z)"
          ><Undo2 size={14} /> Undo</button>
          <button
            className={`tool-btn ${canRedo() ? '' : 'tool-btn--dim'}`}
            onClick={redo}
            title="Redo (Ctrl+Y)"
          ><Redo2 size={14} /> Redo</button>
        </div>
        <div className="toolstrip-right">
          <button
            className={`tool-btn ${snapOn ? 'tool-btn--active' : ''}`}
            onClick={() => setSnapOn(s => !s)}
            title="Snap to Grid"
          ><Maximize size={14} /> Snap {snapOn ? 'ON' : 'OFF'}</button>
          <button
            className={`tool-btn ${showGrid ? 'tool-btn--active' : ''}`}
            onClick={() => setShowGrid(s => !s)}
            title="Toggle Grid"
          ><Grid3x3 size={14} /> Grid</button>
          <button
            className={`tool-btn ${showLabels ? 'tool-btn--active' : ''}`}
            onClick={() => setShowLabels(s => !s)}
            title="Toggle Labels"
          ><Tags size={14} /> Labels</button>
          <button
            className="tool-btn"
            onClick={handleExport}
            title="Export as PNG"
          ><Download size={14} /> Export</button>
        </div>
      </div>

      <div className="editor-body">
        {/* ── LEFT: Library ─────────────────────────────────── */}
        <div className="lib-panel">
          <div className="lib-header">
            <h3>Furniture</h3>
            <span>click to add</span>
          </div>
          <div className="lib-grid">
            {LIBRARY.map(item => (
              <button
                key={item.type}
                className="lib-item"
                onClick={() => addFurniture(item)}
              >
                <span className="lib-emoji">{item.emoji}</span>
                <span className="lib-name">{item.type}</span>
                <span className="lib-size">{item.width}×{item.height}m</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── CENTRE: Canvas Wrapper ────────────────────────────────── */}
        <div className="canvas-wrapper" style={{ position: 'relative', display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div className="canvas-area" style={{ flex: 1, overflow: 'hidden', position: 'relative', display: 'flex' }} ref={containerRef}>
            <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
              <Stage
                ref={stageRef}
                x={stagePos.x}
                y={stagePos.y}
                width={containerSize.w}
                height={containerSize.h}
                scaleX={stageScale}
                scaleY={stageScale}
                onWheel={handleWheel}
                onClick={e => { if (e.target === e.target.getStage()) setSelectedId(null) }}
                style={{ background: 'white', borderRadius: 8, boxShadow: 'var(--sh-lift)' }}
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
                          stroke="rgba(120,100,80,0.13)" strokeWidth={1} listening={false} />
                      )
                    }
                    for (let j = 1; j < stepsH; j++) {
                      const y = PAD + j * GRID_PX
                      lines.push(
                        <Line key={`gy-${j}`}
                          points={[PAD, y, PAD + room.width * SCALE, y]}
                          stroke="rgba(120,100,80,0.13)" strokeWidth={1} listening={false} />
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

                  {/* Labels — same pivot as rect: (item.x, item.y) */}
                  {showLabels && furniture.map(item => {
                    const iw = item.width * SCALE * item.scale
                    const ih = item.height * SCALE * item.scale
                    return (
                      <Text
                        key={'lbl-' + item.id}
                        x={item.x}
                        y={item.y}
                        offsetX={0}
                        offsetY={6 - ih / 2}
                        width={iw}
                        text={item.type}
                        fontSize={11}
                        fill="rgba(255,255,255,0.92)"
                        align="center"
                        listening={false}
                        rotation={item.rotation}
                        ellipsis
                      />
                    )
                  })}

                  <Transformer ref={trRef} rotateEnabled boundBoxFunc={(_, n) => n} />
                </Layer>
              </Stage>
            </div>
          </div>

          {/* Zoom HUD */}
          <div className="zoom-hud" style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}>
            <button className="zoom-btn" onClick={() => setStageScale(s => Math.min(ZOOM_MAX, s * ZOOM_STEP))}>+</button>
            <span className="zoom-pct" onClick={resetZoom} title="Click to reset zoom">
              {Math.round(stageScale * 100)}%
            </span>
            <button className="zoom-btn" onClick={() => setStageScale(s => Math.max(ZOOM_MIN, s / ZOOM_STEP))}>−</button>
          </div>
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
                <Trash2 size={13} /> Remove Item
              </button>
            </div>
          ) : (
            <div className="no-sel">
              <Pointer size={24} color="var(--s-text-3)" strokeWidth={1.5} />
              <p>Click any furniture item to edit its properties</p>
            </div>
          )}
          <div className="item-count">
            <Package size={14} style={{ opacity: 0.6 }} />
            {furniture.length} item{furniture.length !== 1 ? 's' : ''}
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