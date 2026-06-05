// ── Procedural furniture textures (pure code, no asset files) ─────────────
// Generates greyscale albedo patterns + matching normal maps on an offscreen
// canvas, wrapped as THREE.CanvasTexture. The albedo is luminance-only so the
// material `color` (the user's colour pick) tints it via multiply — wood stays
// wood-grained but takes on the chosen hue. Each kind is generated once and
// cached at module scope (textures are expensive to build).

import * as THREE from 'three'

const SIZE = 128

// Cheap deterministic value noise so textures look the same every run.
function makeRand(seed) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

function newCanvas() {
  const c = document.createElement('canvas')
  c.width = SIZE
  c.height = SIZE
  return c
}

// ── Greyscale albedo painters (write r=g=b per pixel) ─────────────────────
function paintWood(data, rand) {
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      // Vertical grain: slow wobble in x, faint growth rings.
      const wobble = Math.sin(y * 0.05) * 4
      const grain = Math.sin((x + wobble) * 0.45) * 0.5 + Math.sin((x + wobble) * 1.7) * 0.25
      const rings = Math.sin(x * 0.06 + Math.sin(y * 0.01)) * 0.15
      let v = 205 + grain * 22 + rings * 18 + (rand() - 0.5) * 10
      v = Math.max(150, Math.min(235, v))
      const i = (y * SIZE + x) * 4
      data[i] = data[i + 1] = data[i + 2] = v
      data[i + 3] = 255
    }
  }
}

function paintFabric(data, rand) {
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      // Over/under weave on a 4px thread grid.
      const warp = (x % 4) < 2
      const weft = (y % 4) < 2
      const over = warp !== weft
      let v = over ? 215 : 192
      v += (rand() - 0.5) * 10
      const i = (y * SIZE + x) * 4
      data[i] = data[i + 1] = data[i + 2] = v
      data[i + 3] = 255
    }
  }
}

function paintLeather(data, rand) {
  // Pebbled grain: scatter soft cell centres, shade by distance to nearest.
  const pts = []
  const r = makeRand(99)
  for (let k = 0; k < 36; k++) pts.push([r() * SIZE, r() * SIZE])
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      let dmin = 1e9
      for (const [px, py] of pts) {
        // wrap distance for seamless tiling
        const dx = Math.min(Math.abs(x - px), SIZE - Math.abs(x - px))
        const dy = Math.min(Math.abs(y - py), SIZE - Math.abs(y - py))
        const d = dx * dx + dy * dy
        if (d < dmin) dmin = d
      }
      const cell = Math.sqrt(dmin)
      let v = 210 - cell * 1.6 + (rand() - 0.5) * 8
      v = Math.max(170, Math.min(225, v))
      const i = (y * SIZE + x) * 4
      data[i] = data[i + 1] = data[i + 2] = v
      data[i + 3] = 255
    }
  }
}

function paintMetal(data, rand) {
  // Brushed: fine horizontal scratches → high-frequency variation along x.
  const rowBase = []
  for (let y = 0; y < SIZE; y++) rowBase[y] = 195 + (rand() - 0.5) * 6
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const scratch = Math.sin(x * 1.3 + y * 0.02) * 6 + (rand() - 0.5) * 14
      let v = rowBase[y] + scratch
      v = Math.max(170, Math.min(225, v))
      const i = (y * SIZE + x) * 4
      data[i] = data[i + 1] = data[i + 2] = v
      data[i + 3] = 255
    }
  }
}

const PAINTERS = { wood: paintWood, fabric: paintFabric, leather: paintLeather, metal: paintMetal }

// Derive a tangent-space normal map from the albedo luminance via Sobel.
function albedoToNormal(albedoData, strength) {
  const out = newCanvas()
  const octx = out.getContext('2d')
  const oimg = octx.createImageData(SIZE, SIZE)
  const lum = (x, y) => {
    const xx = (x + SIZE) % SIZE
    const yy = (y + SIZE) % SIZE
    return albedoData[(yy * SIZE + xx) * 4] / 255
  }
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const dx = (lum(x - 1, y) - lum(x + 1, y)) * strength
      const dy = (lum(x, y - 1) - lum(x, y + 1)) * strength
      const nz = 1
      const len = Math.hypot(dx, dy, nz)
      const i = (y * SIZE + x) * 4
      oimg.data[i] = ((-dx / len) * 0.5 + 0.5) * 255
      oimg.data[i + 1] = ((-dy / len) * 0.5 + 0.5) * 255
      oimg.data[i + 2] = (nz / len * 0.5 + 0.5) * 255
      oimg.data[i + 3] = 255
    }
  }
  octx.putImageData(oimg, 0, 0)
  return out
}

// Per-kind tiling + normal strength.
const REPEAT = { wood: [2, 3], fabric: [5, 5], leather: [3, 3], metal: [3, 3] }
const NORMAL_STRENGTH = { wood: 2.0, fabric: 3.0, leather: 2.5, metal: 1.2 }

const cache = new Map()

// Returns { map, normalMap } THREE textures for a kind, or null if unknown
// or if canvas isn't available (e.g. SSR / test env).
export function getProceduralTexture(kind) {
  if (!PAINTERS[kind]) return null
  if (cache.has(kind)) return cache.get(kind)
  if (typeof document === 'undefined') return null

  const albedo = newCanvas()
  const actx = albedo.getContext('2d')
  if (!actx) return null
  const img = actx.createImageData(SIZE, SIZE)
  PAINTERS[kind](img.data, makeRand(kind.length * 7919 + 13))
  actx.putImageData(img, 0, 0)

  const normalCanvas = albedoToNormal(img.data, NORMAL_STRENGTH[kind])

  const map = new THREE.CanvasTexture(albedo)
  const normalMap = new THREE.CanvasTexture(normalCanvas)
  const [rx, ry] = REPEAT[kind]
  for (const t of [map, normalMap]) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(rx, ry)
    t.anisotropy = 4
  }
  map.colorSpace = THREE.SRGBColorSpace

  const set = { map, normalMap }
  cache.set(kind, set)
  return set
}

// Material name (from the UI dropdown) → texture kind.
export const MATERIAL_TEXTURE = {
  Wood: 'wood',
  Fabric: 'fabric',
  Leather: 'leather',
  Metal: 'metal',
}
