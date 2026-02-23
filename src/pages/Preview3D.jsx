import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useNavigate } from 'react-router-dom'
import { useDesign } from '../context/DesignContext'
import './Preview3D.css'

const SCALE = 80
const PAD = 40

function Room({ room }) {
  const w = room.width
  const d = room.length
  const h = 2.8
  return (
    <group>
      {/* Floor */}
      <mesh position={[w/2, 0, d/2]} rotation={[-Math.PI/2, 0, 0]} receiveShadow>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color={room.floorColor} />
      </mesh>
      {/* Back wall */}
      <mesh position={[w/2, h/2, 0]}>
        <boxGeometry args={[w, h, 0.08]} />
        <meshStandardMaterial color={room.wallColor} />
      </mesh>
      {/* Left wall */}
      <mesh position={[0, h/2, d/2]}>
        <boxGeometry args={[0.08, h, d]} />
        <meshStandardMaterial color={room.wallColor} />
      </mesh>
      {/* Right wall */}
      <mesh position={[w, h/2, d/2]}>
        <boxGeometry args={[0.08, h, d]} />
        <meshStandardMaterial color={room.wallColor} />
      </mesh>
    </group>
  )
}

function FurniturePiece({ item }) {
  const w = item.width  * item.scale
  const d = item.height * item.scale
  const h = 0.5 * item.scale
  const x = (item.x - PAD) / SCALE
  const z = (item.y - PAD) / SCALE
  return (
    <mesh position={[x + w/2, h/2, z + d/2]} castShadow>
      <boxGeometry args={[w, h, d]} />
      <meshStandardMaterial color={item.color} />
    </mesh>
  )
}

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
          <pointLight position={[room.width/2, 2.5, room.length/2]} intensity={0.4} />

          <Room room={room} />
          {furniture.map(item => (
            <FurniturePiece key={item.id} item={item} />
          ))}

          <OrbitControls
            target={[room.width/2, 0.5, room.length/2]}
            maxPolarAngle={Math.PI / 2.1}
            minDistance={1}
            maxDistance={20}
          />
        </Canvas>
      </div>

      <div className="info-bar">
        <span>Room: {room.width}m × {room.length}m</span>
        <span>·</span>
        <span>{furniture.length} furniture item{furniture.length !== 1 ? 's' : ''}</span>
        <span>·</span>
        <span>Wall: {room.wallColor} · Floor: {room.floorColor}</span>
      </div>
    </div>
  )
}