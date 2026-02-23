import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useNavigate } from 'react-router-dom'
import { useDesign } from '../context/DesignContext'
import './Preview3D.css'

const SCALE = 80
const PAD = 40

// ── Per-type heights for varied 3D appearance ──────────────────
const TYPE_HEIGHTS = {
  'Chair': 0.9,
  'Dining Table': 0.75,
  'Sofa': 0.85,
  'Bed': 0.55,
  'Side Table': 0.55,
  'Wardrobe': 1.85,
  'Desk': 0.75,
  'Bookshelf': 1.8,
}

// ── L-Shape helper (mirrors Editor2D logic) ────────────────────
function getLShapeRects3D(room) {
  const fullW = room.width
  const fullD = room.length
  const mainD = fullD * 0.6
  const wingD = fullD - mainD
  const wingW = fullW * 0.5
  return [
    { x: 0, z: 0, w: fullW, d: mainD }, // main bar
    { x: 0, z: mainD, w: wingW, d: wingD }, // left wing
  ]
}

// ── Room component ─────────────────────────────────────────────
function Room({ room }) {
  const w = room.width
  const d = room.length
  const h = 2.8
  const isLShape = room.shape === 'L-Shape'

  return (
    <group>
      {/* Floor(s) */}
      {isLShape ? (
        getLShapeRects3D(room).map((r, i) => (
          <mesh key={i} position={[r.x + r.w / 2, 0, r.z + r.d / 2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[r.w, r.d]} />
            <meshStandardMaterial color={room.floorColor} />
          </mesh>
        ))
      ) : (
        <mesh position={[w / 2, 0, d / 2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[w, d]} />
          <meshStandardMaterial color={room.floorColor} />
        </mesh>
      )}

      {/* Back wall */}
      <mesh position={[w / 2, h / 2, 0]}>
        <boxGeometry args={[w, h, 0.08]} />
        <meshStandardMaterial color={room.wallColor} />
      </mesh>

      {/* Left wall */}
      <mesh position={[0, h / 2, d / 2]}>
        <boxGeometry args={[0.08, h, d]} />
        <meshStandardMaterial color={room.wallColor} />
      </mesh>

      {/* Right wall */}
      <mesh position={[w, h / 2, d / 2]}>
        <boxGeometry args={[0.08, h, d]} />
        <meshStandardMaterial color={room.wallColor} />
      </mesh>

      {/* Ceiling */}
      <mesh position={[w / 2, h, d / 2]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color={room.wallColor} opacity={0.35} transparent />
      </mesh>
    </group>
  )
}

// ── Furniture piece component ──────────────────────────────────
function FurniturePiece({ item }) {
  const fw = item.width * item.scale
  const fd = item.height * item.scale
  const fh = (TYPE_HEIGHTS[item.type] ?? 0.6) * item.scale

  // Convert 2D canvas position to 3D world coords
  const x = (item.x - PAD) / SCALE
  const z = (item.y - PAD) / SCALE

  // Convert 2D rotation (degrees) to 3D Y-axis rotation (radians)
  const rotY = -(item.rotation * Math.PI) / 180

  return (
    <mesh
      position={[x + fw / 2, fh / 2, z + fd / 2]}
      rotation={[0, rotY, 0]}
      castShadow
    >
      <boxGeometry args={[fw, fh, fd]} />
      <meshStandardMaterial color={item.color} />
    </mesh>
  )
}

// ── Main Page ──────────────────────────────────────────────────
export default function Preview3D() {
  const navigate = useNavigate()
  const { room, furniture } = useDesign()

  return (
    <div className="preview3d">
      <div className="preview-topbar">
        <button onClick={() => navigate('/editor')} className="btn-back2d">← Back to 2D</button>
        <div className="topbar-title">
          <span>🏠</span>
          <span>3D Room Preview</span>
        </div>
        <div className="topbar-hint">🖱️ Drag to orbit · Scroll to zoom</div>
      </div>

      <div className="canvas3d">
        <Canvas
          shadows
          camera={{ position: [room.width / 2, room.length * 0.8, room.length * 1.5], fov: 55 }}
          style={{ background: 'linear-gradient(180deg, #c9dde8 0%, #e8eff4 100%)' }}
        >
          <ambientLight intensity={0.7} />
          <directionalLight
            position={[room.width, 5, room.length]}
            intensity={1.2}
            castShadow
            shadow-mapSize={[2048, 2048]}
          />
          <pointLight position={[room.width / 2, 2.5, room.length / 2]} intensity={0.4} />

          <Room room={room} />
          {furniture.map(item => (
            <FurniturePiece key={item.id} item={item} />
          ))}

          <OrbitControls
            target={[room.width / 2, 0.5, room.length / 2]}
            maxPolarAngle={Math.PI / 2.1}
            minDistance={1}
            maxDistance={20}
          />
        </Canvas>
      </div>

      <div className="info-bar">
        <span>Room: {room.width}m × {room.length}m{room.shape === 'L-Shape' ? ' (L-Shape)' : ''}</span>
        <span>·</span>
        <span>{furniture.length} furniture item{furniture.length !== 1 ? 's' : ''}</span>
        <span>·</span>
        <span>Wall: {room.wallColor} · Floor: {room.floorColor}</span>
      </div>
    </div>
  )
}