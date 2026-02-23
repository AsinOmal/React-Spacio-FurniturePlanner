import { useRef, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Stage, Layer, Rect, Text, Transformer } from 'react-konva'
import { useDesign } from '../context/DesignContext'
import SaveModal from '../components/SaveModal'
import './Editor2D.css'

const SCALE = 80
const PAD = 40

const LIBRARY = [
  { type: 'Chair',        width: 0.6, height: 0.6, defaultColor: '#8B7355', emoji: '🪑' },
  { type: 'Dining Table', width: 1.6, height: 0.9, defaultColor: '#6B4C2A', emoji: '🍽️' },
  { type: 'Sofa',         width: 2.0, height: 0.9, defaultColor: '#708090', emoji: '🛋️' },
  { type: 'Bed',          width: 2.0, height: 1.6, defaultColor: '#DEB887', emoji: '🛏️' },
  { type: 'Side Table',   width: 0.5, height: 0.5, defaultColor: '#A0785A', emoji: '🪵' },
  { type: 'Wardrobe',     width: 1.8, height: 0.6, defaultColor: '#5C4033', emoji: '🗄️' },
  { type: 'Desk',         width: 1.2, height: 0.6, defaultColor: '#8B8B6B', emoji: '🖥️' },
  { type: 'Bookshelf',    width: 1.0, height: 0.3, defaultColor: '#7B6B3A', emoji: '📚' },
]

export default function Editor2D() {
  const navigate = useNavigate()
  const {
    room, furniture,
    selectedId, setSelectedId,
    addFurniture, updateFurniture, deleteFurniture,
    saveDesign
  } = useDesign()

  const trRef = useRef()
  const [showSave, setShowSave] = useState(false)

  const cW = room.width  * SCALE + PAD * 2
  const cH = room.length * SCALE + PAD * 2
  const selected = furniture.find(f => f.id === selectedId)

  useEffect(() => {
    if (!trRef.current) return
    const stage = trRef.current.getStage()
    const node = stage?.findOne('#item-' + selectedId)
    trRef.current.nodes(node ? [node] : [])
  }, [selectedId, furniture])

  return (
    <div className="editor">
      {/* Top Bar */}
      <div className="editor-topbar">
        <button onClick={() => navigate('/dashboard')} className="btn-topbar">← Dashboard</button>
        <div className="topbar-title">
          <span>2D Editor</span>
          <span className="room-dims">{room.width}m × {room.length}m</span>
        </div>
        <div className="topbar-right">
          <button onClick={() => setShowSave(true)} className="btn-save">💾 Save</button>
          <button onClick={() => navigate('/preview3d')} className="btn-3d">🏠 3D Preview</button>
        </div>
      </div>

      <div className="editor-body">
        {/* LEFT: Furniture Library */}
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

        {/* CENTRE: Canvas */}
        <div className="canvas-area">
          <Stage
            width={cW}
            height={cH}
            onClick={e => { if (e.target === e.target.getStage()) setSelectedId(null) }}
            style={{ background: 'white', borderRadius: 8, boxShadow: '0 4px 24px rgba(0,0,0,0.15)' }}
          >
            <Layer>
              {/* Floor */}
              <Rect
                x={PAD} y={PAD}
                width={room.width * SCALE}
                height={room.length * SCALE}
                fill={room.floorColor}
                stroke={room.wallColor}
                strokeWidth={14}
              />
              {/* Labels */}
              <Text x={PAD} y={PAD - 22} text={`${room.width}m`} fontSize={13} fill="#64748b" />
              <Text x={10} y={PAD} text={`${room.length}m`} fontSize={13} fill="#64748b" rotation={-90} />

              {/* Furniture */}
              {furniture.map(item => (
                <Rect
                  key={item.id}
                  id={'item-' + item.id}
                  x={item.x} y={item.y}
                  width={item.width  * SCALE * item.scale}
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
                  onDragEnd={e => updateFurniture(item.id, { x: e.target.x(), y: e.target.y() })}
                />
              ))}
              {/* Item Labels */}
              {furniture.map(item => (
                <Text
                  key={'lbl-' + item.id}
                  x={item.x + 5} y={item.y + 5}
                  text={item.type}
                  fontSize={11} fill="white"
                  listening={false}
                  rotation={item.rotation}
                />
              ))}
              <Transformer ref={trRef} rotateEnabled boundBoxFunc={(old, n) => n} />
            </Layer>
          </Stage>
        </div>

        {/* RIGHT: Properties */}
        <div className="props-panel">
          <h3>Properties</h3>
          {selected ? (
            <div className="props-content">
              <div className="prop-name">{selected.type}</div>

              <div className="prop-row">
                <label>Colour</label>
                <div className="color-row">
                  <input type="color" value={selected.color}
                    onChange={e => updateFurniture(selectedId, { color: e.target.value })} />
                  <span>{selected.color}</span>
                </div>
              </div>

              <div className="prop-row">
                <label>Scale — {selected.scale.toFixed(1)}×</label>
                <input type="range" min="0.5" max="2.5" step="0.1"
                  value={selected.scale}
                  onChange={e => updateFurniture(selectedId, { scale: +e.target.value })} />
              </div>

              <div className="prop-row">
                <label>Rotate — {selected.rotation}°</label>
                <input type="range" min="0" max="355" step="5"
                  value={selected.rotation}
                  onChange={e => updateFurniture(selectedId, { rotation: +e.target.value })} />
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
          <div className="item-count">📦 {furniture.length} item{furniture.length !== 1 ? 's' : ''}</div>
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