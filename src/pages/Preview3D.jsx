import { useState, useRef, createContext, useContext, useMemo, Suspense, Component } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, PointerLockControls, KeyboardControls, useKeyboardControls, useGLTF } from '@react-three/drei'
import { useNavigate } from 'react-router-dom'
import { useDesign } from '../context/DesignContext'
import { Home, Mouse, Sun, SunDim, Layers, Footprints, Box } from 'lucide-react'
import * as THREE from 'three'
import './Preview3D.css'

const SCALE = 80
const PAD = 40

// ── L-Shape helper ─────────────────────────────────────────────
function getLShapeRects3D(room) {
  const fullW = room.width
  const fullD = room.length
  const mainD = fullD * 0.6
  const wingD = fullD - mainD
  const wingW = fullW * 0.5
  return [
    { x: 0, z: 0, w: fullW, d: mainD },
    { x: 0, z: mainD, w: wingW, d: wingD },
  ]
}

// ── Shared material helper ──────────────────────────────────────
const MaterialContext = createContext('Matte')

const MAT_PRESETS = {
  Matte: { roughness: 0.9, metalness: 0.0, clearcoat: 0.0 },
  Wood: { roughness: 0.4, metalness: 0.1, clearcoat: 0.4, clearcoatRoughness: 0.2 },
  Fabric: { roughness: 1.0, metalness: 0.0, clearcoat: 0.0 },
  Leather: { roughness: 0.3, metalness: 0.1, clearcoat: 0.2, clearcoatRoughness: 0.3 },
  Metal: { roughness: 0.2, metalness: 0.9, clearcoat: 0.0 },
  Plastic: { roughness: 0.1, metalness: 0.0, clearcoat: 1.0, clearcoatRoughness: 0.1 },
  Glass: { roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.6, transmission: 0.9, thickness: 0.5 },
}

function Mat({ color, roughness, metalness }) {
  const materialName = useContext(MaterialContext)
  const preset = MAT_PRESETS[materialName] || MAT_PRESETS.Matte
  const finalRoughness = roughness ?? preset.roughness
  const finalMetalness = metalness ?? preset.metalness

  return (
    <meshPhysicalMaterial
      color={color}
      {...preset}
      roughness={finalRoughness}
      metalness={finalMetalness}
    />
  )
}

// ── Shared leg helper (thin box leg) ───────────────────────────
function Leg({ x, z, h, r = 0.035, color }) {
  return (
    <mesh position={[x, h / 2, z]} castShadow>
      <boxGeometry args={[r, h, r]} />
      <Mat color={color} roughness={0.8} />
    </mesh>
  )
}

// ══════════════════════════════════════════════════════════════
// CHAIR — seat + 4 legs + backrest
// ══════════════════════════════════════════════════════════════
function Chair3D({ fw, fd, fh, color }) {
  const legH = fh * 0.52
  const seatY = legH
  const seatT = fh * 0.1
  const backH = fh * 0.52
  const legInset = 0.04
  const darkColor = shadeColor(color, -30)

  return (
    <group>
      {/* Seat */}
      <mesh position={[0, seatY + seatT / 2, 0]} castShadow>
        <boxGeometry args={[fw, seatT, fd * 0.65]} />
        <Mat color={color} roughness={0.7} />
      </mesh>
      {/* Backrest */}
      <mesh position={[0, seatY + backH / 2, -fd * 0.3]} castShadow>
        <boxGeometry args={[fw * 0.9, backH, fd * 0.1]} />
        <Mat color={color} roughness={0.7} />
      </mesh>
      {/* 4 legs */}
      <Leg x={-fw / 2 + legInset} z={-fd * 0.28} h={legH} color={darkColor} />
      <Leg x={fw / 2 - legInset} z={-fd * 0.28} h={legH} color={darkColor} />
      <Leg x={-fw / 2 + legInset} z={fd * 0.28} h={legH} color={darkColor} />
      <Leg x={fw / 2 - legInset} z={fd * 0.28} h={legH} color={darkColor} />
    </group>
  )
}

// ══════════════════════════════════════════════════════════════
// DINING TABLE — flat top + 4 legs
// ══════════════════════════════════════════════════════════════
function DiningTable3D({ fw, fd, fh, color }) {
  const legH = fh * 0.9
  const topT = fh * 0.07
  const legInset = 0.06
  const darkColor = shadeColor(color, -25)

  return (
    <group>
      {/* Tabletop */}
      <mesh position={[0, fh - topT / 2, 0]} castShadow>
        <boxGeometry args={[fw, topT, fd]} />
        <Mat color={color} roughness={0.5} />
      </mesh>
      {/* 4 Legs */}
      <Leg x={-fw / 2 + legInset} z={-fd / 2 + legInset} h={legH} color={darkColor} />
      <Leg x={fw / 2 - legInset} z={-fd / 2 + legInset} h={legH} color={darkColor} />
      <Leg x={-fw / 2 + legInset} z={fd / 2 - legInset} h={legH} color={darkColor} />
      <Leg x={fw / 2 - legInset} z={fd / 2 - legInset} h={legH} color={darkColor} />
    </group>
  )
}

// ══════════════════════════════════════════════════════════════
// SOFA — base + backrest + 2 armrests + cushions
// ══════════════════════════════════════════════════════════════
function Sofa3D({ fw, fd, fh, color }) {
  const baseH = fh * 0.38
  const backH = fh * 0.55
  const armH = fh * 0.46
  const armW = fw * 0.1
  const cushionH = baseH * 0.18
  const cushionColor = shadeColor(color, 15)
  const darkColor = shadeColor(color, -20)

  return (
    <group>
      {/* Base/seat */}
      <mesh position={[0, baseH / 2, fd * 0.1]} castShadow>
        <boxGeometry args={[fw * 0.8, baseH, fd * 0.6]} />
        <Mat color={color} roughness={0.8} />
      </mesh>
      {/* Backrest */}
      <mesh position={[0, baseH + backH / 2, -fd * 0.28]} castShadow>
        <boxGeometry args={[fw * 0.8, backH, fd * 0.18]} />
        <Mat color={color} roughness={0.8} />
      </mesh>
      {/* Left armrest */}
      <mesh position={[-fw / 2 + armW / 2, armH / 2, fd * 0.05]} castShadow>
        <boxGeometry args={[armW, armH, fd * 0.78]} />
        <Mat color={darkColor} roughness={0.8} />
      </mesh>
      {/* Right armrest */}
      <mesh position={[fw / 2 - armW / 2, armH / 2, fd * 0.05]} castShadow>
        <boxGeometry args={[armW, armH, fd * 0.78]} />
        <Mat color={darkColor} roughness={0.8} />
      </mesh>
      {/* Cushions (3 across) */}
      {[-1, 0, 1].map(i => (
        <mesh key={i} position={[i * fw * 0.24, baseH + cushionH / 2, fd * 0.12]} castShadow>
          <boxGeometry args={[fw * 0.23, cushionH, fd * 0.5]} />
          <Mat color={cushionColor} roughness={0.9} />
        </mesh>
      ))}
    </group>
  )
}

// ══════════════════════════════════════════════════════════════
// BED — frame + mattress + headboard + pillow
// ══════════════════════════════════════════════════════════════
function Bed3D({ fw, fd, fh, color }) {
  const frameH = fh * 0.12
  const mattressH = fh * 0.22
  const headH = fh
  const pillowColor = '#f5f0e8'
  const mattressColor = shadeColor(color, 20)
  const darkColor = shadeColor(color, -20)

  return (
    <group>
      {/* Bed frame base */}
      <mesh position={[0, frameH / 2, 0]} castShadow>
        <boxGeometry args={[fw, frameH, fd]} />
        <Mat color={darkColor} roughness={0.7} />
      </mesh>
      {/* Mattress */}
      <mesh position={[0, frameH + mattressH / 2, fd * 0.05]} castShadow>
        <boxGeometry args={[fw * 0.92, mattressH, fd * 0.82]} />
        <Mat color={mattressColor} roughness={0.9} />
      </mesh>
      {/* Headboard */}
      <mesh position={[0, headH / 2, -fd * 0.44]} castShadow>
        <boxGeometry args={[fw, headH, fd * 0.1]} />
        <Mat color={color} roughness={0.6} />
      </mesh>
      {/* Footboard */}
      <mesh position={[0, frameH * 2, fd * 0.46]} castShadow>
        <boxGeometry args={[fw, frameH * 2.5, fd * 0.06]} />
        <Mat color={darkColor} roughness={0.7} />
      </mesh>
      {/* Pillows (2) */}
      {[-1, 1].map(side => (
        <mesh key={side} position={[side * fw * 0.22, frameH + mattressH + 0.04, -fd * 0.28]} castShadow>
          <boxGeometry args={[fw * 0.38, 0.08, fd * 0.22]} />
          <Mat color={pillowColor} roughness={1.0} />
        </mesh>
      ))}
    </group>
  )
}

// ══════════════════════════════════════════════════════════════
// SIDE TABLE — small top + 4 thin legs
// ══════════════════════════════════════════════════════════════
function SideTable3D({ fw, fd, fh, color }) {
  const legH = fh * 0.85
  const topT = fh * 0.08
  const legInset = 0.03
  const darkColor = shadeColor(color, -20)

  return (
    <group>
      {/* Top */}
      <mesh position={[0, fh - topT / 2, 0]} castShadow>
        <boxGeometry args={[fw, topT, fd]} />
        <Mat color={color} roughness={0.5} metalness={0.1} />
      </mesh>
      {/* Shelf (middle) */}
      <mesh position={[0, fh * 0.42, 0]} castShadow>
        <boxGeometry args={[fw * 0.85, topT * 0.7, fd * 0.85]} />
        <Mat color={color} roughness={0.5} />
      </mesh>
      {/* 4 thin legs */}
      <Leg x={-fw / 2 + legInset} z={-fd / 2 + legInset} h={legH} r={0.025} color={darkColor} />
      <Leg x={fw / 2 - legInset} z={-fd / 2 + legInset} h={legH} r={0.025} color={darkColor} />
      <Leg x={-fw / 2 + legInset} z={fd / 2 - legInset} h={legH} r={0.025} color={darkColor} />
      <Leg x={fw / 2 - legInset} z={fd / 2 - legInset} h={legH} r={0.025} color={darkColor} />
    </group>
  )
}

// ══════════════════════════════════════════════════════════════
// WARDROBE — tall body + door panels + handles
// ══════════════════════════════════════════════════════════════
function Wardrobe3D({ fw, fd, fh, color }) {
  const panelColor = shadeColor(color, 10)
  const handleColor = '#888'
  const darkColor = shadeColor(color, -20)

  return (
    <group>
      {/* Main body */}
      <mesh position={[0, fh / 2, 0]} castShadow>
        <boxGeometry args={[fw, fh, fd]} />
        <Mat color={color} roughness={0.5} />
      </mesh>
      {/* Left door panel */}
      <mesh position={[-fw * 0.25, fh / 2, fd / 2 + 0.01]}>
        <boxGeometry args={[fw * 0.46, fh * 0.96, 0.02]} />
        <Mat color={panelColor} roughness={0.4} />
      </mesh>
      {/* Right door panel */}
      <mesh position={[fw * 0.25, fh / 2, fd / 2 + 0.01]}>
        <boxGeometry args={[fw * 0.46, fh * 0.96, 0.02]} />
        <Mat color={panelColor} roughness={0.4} />
      </mesh>
      {/* Centre seam */}
      <mesh position={[0, fh / 2, fd / 2 + 0.015]}>
        <boxGeometry args={[0.015, fh * 0.96, 0.025]} />
        <Mat color={darkColor} roughness={0.4} />
      </mesh>
      {/* Left door handle */}
      <mesh position={[-fw * 0.07, fh * 0.5, fd / 2 + 0.03]}>
        <boxGeometry args={[0.04, 0.12, 0.03]} />
        <Mat color={handleColor} roughness={0.3} metalness={0.6} />
      </mesh>
      {/* Right door handle */}
      <mesh position={[fw * 0.07, fh * 0.5, fd / 2 + 0.03]}>
        <boxGeometry args={[0.04, 0.12, 0.03]} />
        <Mat color={handleColor} roughness={0.3} metalness={0.6} />
      </mesh>
    </group>
  )
}

// ══════════════════════════════════════════════════════════════
// DESK — worktop + 2 legs + side pedestal
// ══════════════════════════════════════════════════════════════
function Desk3D({ fw, fd, fh, color }) {
  const topT = fh * 0.07
  const legH = fh - topT
  const darkColor = shadeColor(color, -20)
  const drawerColor = shadeColor(color, -10)

  return (
    <group>
      {/* Worktop */}
      <mesh position={[0, fh - topT / 2, 0]} castShadow>
        <boxGeometry args={[fw, topT, fd]} />
        <Mat color={color} roughness={0.45} />
      </mesh>
      {/* Right pedestal (drawer unit) */}
      <mesh position={[fw * 0.38, legH / 2, 0]} castShadow>
        <boxGeometry args={[fw * 0.22, legH, fd * 0.9]} />
        <Mat color={drawerColor} roughness={0.55} />
      </mesh>
      {/* 2 drawer lines */}
      {[0.25, 0.55].map((yf, i) => (
        <mesh key={i} position={[fw * 0.38, legH * yf, fd / 2 + 0.005]}>
          <boxGeometry args={[fw * 0.18, 0.01, 0.01]} />
          <Mat color={darkColor} />
        </mesh>
      ))}
      {/* Left leg */}
      <Leg x={-fw * 0.42} z={0} h={legH} r={0.05} color={darkColor} />
    </group>
  )
}

// ══════════════════════════════════════════════════════════════
// BOOKSHELF — frame + 4 shelves + book spines
// ══════════════════════════════════════════════════════════════
function Bookshelf3D({ fw, fd, fh, color }) {
  const boardT = 0.04
  const darkColor = shadeColor(color, -25)
  const shelfCount = 4
  const bookColors = ['#b5451b', '#2e6b9c', '#2d7a45', '#8b5e13', '#6b2d8b', '#1a5c7a']

  return (
    <group>
      {/* Back panel */}
      <mesh position={[0, fh / 2, -fd / 2 + 0.01]} castShadow>
        <boxGeometry args={[fw, fh, boardT]} />
        <Mat color={darkColor} roughness={0.8} />
      </mesh>
      {/* Left side */}
      <mesh position={[-fw / 2 + boardT / 2, fh / 2, 0]} castShadow>
        <boxGeometry args={[boardT, fh, fd]} />
        <Mat color={color} roughness={0.6} />
      </mesh>
      {/* Right side */}
      <mesh position={[fw / 2 - boardT / 2, fh / 2, 0]} castShadow>
        <boxGeometry args={[boardT, fh, fd]} />
        <Mat color={color} roughness={0.6} />
      </mesh>
      {/* Top */}
      <mesh position={[0, fh - boardT / 2, 0]} castShadow>
        <boxGeometry args={[fw, boardT, fd]} />
        <Mat color={color} roughness={0.6} />
      </mesh>
      {/* Bottom */}
      <mesh position={[0, boardT / 2, 0]} castShadow>
        <boxGeometry args={[fw, boardT, fd]} />
        <Mat color={color} roughness={0.6} />
      </mesh>
      {/* Shelves */}
      {Array.from({ length: shelfCount }).map((_, i) => {
        const shelfY = (fh / (shelfCount + 1)) * (i + 1)
        return (
          <mesh key={i} position={[0, shelfY, 0]} castShadow>
            <boxGeometry args={[fw - boardT * 2, boardT, fd]} />
            <Mat color={color} roughness={0.6} />
          </mesh>
        )
      })}
      {/* Books on each shelf */}
      {Array.from({ length: shelfCount }).map((_, si) => {
        const shelfY = (fh / (shelfCount + 1)) * (si + 1)
        let xCursor = -fw / 2 + boardT + 0.03
        const books = []
        let bi = 0
        while (xCursor < fw / 2 - boardT - 0.05) {
          const bw = 0.04 + Math.random() * 0.04
          const bh = 0.1 + Math.random() * 0.12
          books.push(
            <mesh key={bi++} position={[xCursor + bw / 2, shelfY + boardT / 2 + bh / 2, 0]} castShadow>
              <boxGeometry args={[bw, bh, fd * 0.75]} />
              <Mat color={bookColors[(si * 4 + bi) % bookColors.length]} roughness={0.9} />
            </mesh>
          )
          xCursor += bw + 0.01
        }
        return books
      })}
    </group>
  )
}

// ══════════════════════════════════════════════════════════════
// Utility: lighten/darken a hex colour
// ══════════════════════════════════════════════════════════════
function shadeColor(hex, amount) {
  let col = hex.replace('#', '')
  if (col.length === 3) col = col.split('').map(c => c + c).join('')
  const num = parseInt(col, 16)
  const r = Math.min(255, Math.max(0, (num >> 16) + amount))
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount))
  const b = Math.min(255, Math.max(0, (num & 0xff) + amount))
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`
}

// ══════════════════════════════════════════════════════════════
// Dispatcher — picks the right component per type
// ══════════════════════════════════════════════════════════════
const TYPE_HEIGHTS = {
  'Chair': 0.9,
  'Dining Table': 0.80,
  'Sofa': 0.95,
  'Bed': 0.70,
  'Side Table': 0.60,
  'Wardrobe': 1.85,
  'Desk': 0.80,
  'Bookshelf': 1.80,
}

// ── Model Error Boundary ──────────────────────────────────────
class ModelErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true }
  }
  componentDidCatch(error, errorInfo) {
    console.error('Custom 3D model failed to load:', error, errorInfo)
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback
    }
    return this.props.children
  }
}

// ── Custom GLTF Model Renderer ────────────────────────────────
function CustomGLTFModel({ url, targetWidth, targetDepth }) {
  const { scene } = useGLTF(url)
  const clonedScene = useMemo(() => scene.clone(), [scene])

  const [scale, yOffset] = useMemo(() => {
    const box = new THREE.Box3().setFromObject(clonedScene)
    const size = new THREE.Vector3()
    box.getSize(size)

    const scaleX = targetWidth / size.x
    const scaleZ = targetDepth / size.z
    const finalScale = Math.min(scaleX, scaleZ) * 0.9 // 90% to afford some padding

    // Y offset to rest on origin
    const yOffset = -box.min.y * finalScale

    clonedScene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })

    return [finalScale, yOffset]
  }, [clonedScene, targetWidth, targetDepth])

  return <primitive object={clonedScene} scale={[scale, scale, scale]} position={[0, yOffset, 0]} />
}

function FurniturePiece({ item }) {
  const fw = item.width * item.scale
  const fd = item.height * item.scale
  const fh = (TYPE_HEIGHTS[item.type] ?? 0.7) * item.scale

  const x = (item.x - PAD) / SCALE
  const z = (item.y - PAD) / SCALE
  const rotY = -(item.rotation * Math.PI) / 180

  const props = { fw, fd, fh, color: item.color }
  let Shape
  if (item.type === 'Custom Model') {
    Shape = (
      <ModelErrorBoundary fallback={
        <mesh castShadow>
          <boxGeometry args={[fw, fh, fd]} />
          <Mat color="#ff3333" /> {/* Red box for error */}
        </mesh>
      }>
        <Suspense fallback={
          <mesh castShadow>
            <boxGeometry args={[fw, fh, fd]} />
            <Mat color="#cccccc" /> {/* Grey box for loading */}
          </mesh>
        }>
          <CustomGLTFModel url={item.modelUrl} targetWidth={fw} targetDepth={fd} />
        </Suspense>
      </ModelErrorBoundary>
    )
  } else {
    switch (item.type) {
      case 'Chair': Shape = <Chair3D        {...props} />; break
      case 'Dining Table': Shape = <DiningTable3D  {...props} />; break
      case 'Sofa': Shape = <Sofa3D         {...props} />; break
      case 'Bed': Shape = <Bed3D          {...props} />; break
      case 'Side Table': Shape = <SideTable3D    {...props} />; break
      case 'Wardrobe': Shape = <Wardrobe3D     {...props} />; break
      case 'Desk': Shape = <Desk3D         {...props} />; break
      case 'Bookshelf': Shape = <Bookshelf3D    {...props} />; break
      default:
        Shape = (
          <mesh castShadow>
            <boxGeometry args={[fw, fh, fd]} />
            <Mat color={item.color} />
          </mesh>
        )
    }
  }

  return (
    <MaterialContext.Provider value={item.material || 'Matte'}>
      <group position={[x, 0, z]} rotation={[0, rotY, 0]}>
        {Shape}
      </group>
    </MaterialContext.Provider>
  )
}

// ── Room component ─────────────────────────────────────────────
function Room({ room, showWalls }) {
  const w = room.width
  const d = room.length
  const h = 2.8
  const isLShape = room.shape === 'L-Shape'
  const isCustom = room.shape === 'Custom' && room.customPolygon && room.customPolygon.length > 2

  let customShape = null
  let customWalls = []
  if (isCustom) {
    customShape = new THREE.Shape()
    const pts = room.customPolygon.map(p => ({
      x: (p.x - PAD) / SCALE,
      z: (p.y - PAD) / SCALE
    }))
    customShape.moveTo(pts[0].x, -pts[0].z)
    for (let i = 1; i < pts.length; i++) {
      customShape.lineTo(pts[i].x, -pts[i].z)
    }

    if (showWalls) {
      const WALL_THICKNESS = 0.08
      for (let i = 0; i < pts.length; i++) {
        const p1 = pts[i]
        const p2 = pts[(i + 1) % pts.length]
        const dx = p2.x - p1.x
        const dz = p2.z - p1.z
        const len = Math.hypot(dx, dz)
        const cx = (p1.x + p2.x) / 2
        const cz = (p1.z + p2.z) / 2
        const rotY = -Math.atan2(dz, dx)

        customWalls.push(
          <mesh key={`cw-${i}`} position={[cx, h / 2, cz]} rotation={[0, rotY, 0]}>
            <boxGeometry args={[len + WALL_THICKNESS, h, WALL_THICKNESS]} />
            <meshPhysicalMaterial color={room.wallColor} />
          </mesh>
        )
      }
    }
  }

  return (
    <group>
      {isCustom && customShape ? (
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <shapeGeometry args={[customShape]} />
          <meshPhysicalMaterial color={room.floorColor} side={THREE.DoubleSide} />
        </mesh>
      ) : isLShape ? (
        getLShapeRects3D(room).map((r, i) => (
          <mesh key={i} position={[r.x + r.w / 2, 0, r.z + r.d / 2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[r.w, r.d]} />
            <meshPhysicalMaterial color={room.floorColor} />
          </mesh>
        ))
      ) : (
        <mesh position={[w / 2, 0, d / 2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[w, d]} />
          <meshPhysicalMaterial color={room.floorColor} />
        </mesh>
      )}

      {/* Only render walls if showWalls is true */}
      {showWalls && (
        isCustom ? (
          <>
            {customWalls}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, h, 0]} receiveShadow>
              <shapeGeometry args={[customShape]} />
              <meshPhysicalMaterial color={room.wallColor} opacity={0.3} transparent side={THREE.DoubleSide} />
            </mesh>
          </>
        ) : (
          <>
            {/* Back wall */}
            <mesh position={[w / 2, h / 2, 0]}>
              <boxGeometry args={[w, h, 0.08]} />
              <meshPhysicalMaterial color={room.wallColor} />
            </mesh>
            {/* Left wall */}
            <mesh position={[0, h / 2, d / 2]}>
              <boxGeometry args={[0.08, h, d]} />
              <meshPhysicalMaterial color={room.wallColor} />
            </mesh>
            {/* Right wall */}
            <mesh position={[w, h / 2, d / 2]}>
              <boxGeometry args={[0.08, h, d]} />
              <meshPhysicalMaterial color={room.wallColor} />
            </mesh>
            {/* Ceiling */}
            <mesh position={[w / 2, h, d / 2]} rotation={[Math.PI / 2, 0, 0]}>
              <planeGeometry args={[w, d]} />
              <meshPhysicalMaterial color={room.wallColor} opacity={0.3} transparent />
            </mesh>
          </>
        )
      )}
    </group>
  )
}

// ── Utility: Point in Polygon (Ray Casting) ────────────────────────
function isPointInPolygon(point, vs) {
  let x = point[0], y = point[1]
  let inside = false
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    let xi = vs[i][0], yi = vs[i][1]
    let xj = vs[j][0], yj = vs[j][1]
    let intersect = ((yi > y) != (yj > y))
      && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)
    if (intersect) inside = !inside
  }
  return inside
}

// ── FPS Movement Controller ─────────────────────────────────────────
function FpsController({ room }) {
  const [, get] = useKeyboardControls()
  const { camera } = useThree()
  const velocity = useRef(new THREE.Vector3())
  const direction = useRef(new THREE.Vector3())
  const SPEED = 4.0

  useFrame((state, delta) => {
    const { forward, backward, left, right } = get()

    // Calculate input direction
    const z = Number(forward) - Number(backward)
    const x = Number(right) - Number(left)
    direction.current.set(x, 0, -z).normalize()

    // Apply movement relative to camera rotation
    if (direction.current.lengthSq() > 0) {
      velocity.current.copy(direction.current).multiplyScalar(SPEED * delta)
      camera.translateX(velocity.current.x)
      camera.translateZ(velocity.current.z)
    }

    // Lock camera Y to eye level (~1.6m) inside the room bounds
    camera.position.y = 1.6

    // Basic collision (don't walk through walls)
    const PAD = 0.5 // keep half a meter from walls

    if (room.shape === 'Custom' && room.customPolygon && room.customPolygon.length > 2) {
      const poly = room.customPolygon.map(p => [(p.x - 40) / 80, (p.y - 40) / 80])
      // If we stepped outside the polygon, push back to previous safe position
      // For a robust implementation, you would calculate intersection, but for now we clamp securely
      if (!isPointInPolygon([camera.position.x, camera.position.z], poly)) {
        camera.translateX(-velocity.current.x)
        camera.translateZ(-velocity.current.z)
      }
    } else {
      if (camera.position.x < PAD) camera.position.x = PAD
      if (camera.position.x > room.width - PAD) camera.position.x = room.width - PAD
      if (camera.position.z < PAD) camera.position.z = PAD
      if (camera.position.z > room.length - PAD) camera.position.z = room.length - PAD
    }
  })

  return null
}

// ── Main Page ──────────────────────────────────────────────────
export default function Preview3D() {
  const navigate = useNavigate()
  const { room, furniture } = useDesign()
  const [shading, setShading] = useState(1.0)   // 0.1 – 2.0
  const [shadows, setShadows] = useState(true)
  const [isWalking, setIsWalking] = useState(false)
  const [showWalls, setShowWalls] = useState(true)

  return (
    <div className="preview3d">
      <div className="preview-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate('/editor')} className="btn-back2d">← Back to 2D</button>
          <span style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 18, fontWeight: 500, color: 'var(--s-text)' }}>Spacio</span>
        </div>
        <div className="topbar-title">
          <Home size={16} strokeWidth={2.5} />
          <span>3D Room Preview</span>
        </div>
        <div className="topbar-hint" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {/* Sunlight slider */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--s-text-2, #666)', userSelect: 'none' }}>
            <SunDim size={14} strokeWidth={2} style={{ opacity: 0.7 }} />
            <input
              type="range" min="0.1" max="2.0" step="0.05"
              value={shading}
              onChange={e => setShading(parseFloat(e.target.value))}
              style={{ width: 90, accentColor: '#f59e0b', cursor: 'pointer' }}
              title="Sunlight intensity"
            />
            <Sun size={14} strokeWidth={2} style={{ opacity: 0.7 }} />
          </label>
          {/* Walls toggle */}
          <button
            onClick={() => setShowWalls(w => !w)}
            title={showWalls ? 'Hide Walls' : 'Show Walls'}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 6, cursor: 'pointer', border: 'none',
              background: showWalls ? '#1a2744' : 'transparent',
              color: showWalls ? '#fff' : 'var(--s-text-2, #666)',
              outline: showWalls ? 'none' : '1px solid #ccc',
            }}
          >
            <Box size={13} /> {showWalls ? 'Walls ON' : 'Walls OFF'}
          </button>
          {/* Shadow toggle */}
          <button
            onClick={() => setShadows(s => !s)}
            title={shadows ? 'Shadows ON — click to disable' : 'Shadows OFF — click to enable'}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 6, cursor: 'pointer', border: 'none',
              background: shadows ? '#1a2744' : 'transparent',
              color: shadows ? '#fff' : 'var(--s-text-2, #666)',
              outline: shadows ? 'none' : '1px solid #ccc',
            }}
          >
            <Layers size={13} /> {shadows ? 'Shadows' : 'Flat'}
          </button>
          {/* Walk mode toggle */}
          <button
            onClick={() => setIsWalking(w => !w)}
            title={isWalking ? 'Exit Walk Mode (ESC)' : 'Enter First-Person Walk Mode'}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 6, cursor: 'pointer', border: 'none',
              background: isWalking ? '#10b981' : 'transparent',
              color: isWalking ? '#fff' : 'var(--s-text-2, #666)',
              outline: isWalking ? 'none' : '1px solid #ccc',
            }}
          >
            <Footprints size={13} /> {isWalking ? 'Walking' : 'Walk'}
          </button>

          {isWalking ? (
            <>
              <Mouse size={14} strokeWidth={2.5} style={{ opacity: 0.7 }} />
              <span>Look around · WASD to move · ESC to exit</span>
            </>
          ) : (
            <>
              <Mouse size={14} strokeWidth={2.5} style={{ opacity: 0.7 }} />
              <span>Drag to orbit · Scroll to zoom</span>
            </>
          )}
        </div>
      </div>

      <div className="canvas3d">
        <KeyboardControls
          map={[
            { name: 'forward', keys: ['ArrowUp', 'KeyW'] },
            { name: 'backward', keys: ['ArrowDown', 'KeyS'] },
            { name: 'left', keys: ['ArrowLeft', 'KeyA'] },
            { name: 'right', keys: ['ArrowRight', 'KeyD'] },
          ]}
        >
          <Canvas
            shadows
            camera={{ position: [room.width / 2, room.length * 1.4, room.length * 2.4], fov: 52 }}
            style={{ background: 'linear-gradient(180deg, #c9dde8 0%, #e8eff4 100%)' }}
          >
            <ambientLight intensity={0.55 * shading} />
            <directionalLight
              position={[room.width * 1.2, 6, room.length * 1.2]}
              intensity={1.4 * shading}
              castShadow={shadows}
              shadow-mapSize={[2048, 2048]}
            />
            <pointLight position={[room.width / 2, 2.4, room.length / 2]} intensity={0.35 * shading} />
            <hemisphereLight skyColor="#ddeeff" groundColor="#8a7060" intensity={0.4 * shading} />

            <Room room={room} showWalls={showWalls} />
            {furniture.map(item => (
              <FurniturePiece key={item.id} item={item} />
            ))}

            {/* Controls toggle based on walking state */}
            {isWalking ? (
              <>
                <PointerLockControls onUnlock={() => setIsWalking(false)} />
                <FpsController room={room} />
              </>
            ) : (
              <OrbitControls
                target={[room.width / 2, 0.6, room.length / 2]}
                maxPolarAngle={Math.PI / 2.1}
                minDistance={1}
                maxDistance={22}
              />
            )}
          </Canvas>
        </KeyboardControls>
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