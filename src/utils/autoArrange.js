// ── Auto-arrange furniture ───────────────────────────────────
// Heuristic layout: large "anchor" pieces are pushed flush against the
// walls (rotated so their back faces the wall), tables are centred, and
// small pieces are tucked into remaining wall space. Every final position
// is clamped to the room floor. Pure function — returns a new array.

import { SCALE, PAD, clampToRoom } from './geometry'

// Pieces that look best with their back against a wall.
const WALL_BACK = new Set(['Bed', 'Wardrobe', 'Sofa', 'Bookshelf', 'Desk'])
// Pieces that belong in the middle of the room.
const CENTER = new Set(['Dining Table'])

// Footprint area (m²) for ordering — larger items get placed first.
function area(item) {
  return (item.width || 1) * (item.height || 1)
}

// Place an item centred against a given wall, rotated to face inward.
// wall: 'top' | 'bottom' | 'left' | 'right'. offset slides it along the wall.
function placeAgainstWall(item, room, wall, offset) {
  const floorRight = PAD + room.width * SCALE
  const floorBottom = PAD + room.length * SCALE
  const cxRoom = PAD + (room.width * SCALE) / 2
  const cyRoom = PAD + (room.length * SCALE) / 2

  let rotation = item.rotation || 0
  let cx = cxRoom
  let cy = cyRoom

  if (wall === 'top') {
    rotation = 0
    cx = cxRoom + offset
    cy = PAD + (item.height * SCALE * item.scale) / 2
  } else if (wall === 'bottom') {
    rotation = 0
    cx = cxRoom + offset
    cy = floorBottom - (item.height * SCALE * item.scale) / 2
  } else if (wall === 'left') {
    rotation = 90
    cy = cyRoom + offset
    cx = PAD + (item.height * SCALE * item.scale) / 2
  } else if (wall === 'right') {
    rotation = 90
    cy = cyRoom + offset
    cx = floorRight - (item.height * SCALE * item.scale) / 2
  }

  const placed = { ...item, rotation }
  const clamped = clampToRoom(cx, cy, placed, room)
  return { ...placed, x: clamped.x, y: clamped.y }
}

export function autoArrange(furniture, room) {
  if (!furniture || furniture.length === 0) return furniture

  const cxRoom = PAD + (room.width * SCALE) / 2
  const cyRoom = PAD + (room.length * SCALE) / 2

  // Sort biggest-first so anchors claim the prime wall slots.
  const ordered = [...furniture].sort((a, b) => area(b) - area(a))

  // Walls cycled for anchor pieces, plus a per-wall offset cursor so
  // multiple wall pieces don't stack on top of each other.
  const walls = ['top', 'right', 'bottom', 'left']
  const wallOffsets = { top: 0, right: 0, bottom: 0, left: 0 }
  let wallIdx = 0

  return ordered.map((item) => {
    // Custom models / unknown footprints: leave roughly in place, just clamp.
    if (item.type === 'Custom Model') {
      const clamped = clampToRoom(item.x ?? cxRoom, item.y ?? cyRoom, item, room)
      return { ...item, x: clamped.x, y: clamped.y }
    }

    if (CENTER.has(item.type)) {
      const placed = { ...item, rotation: 0 }
      const clamped = clampToRoom(cxRoom, cyRoom, placed, room)
      return { ...placed, x: clamped.x, y: clamped.y }
    }

    if (WALL_BACK.has(item.type)) {
      const wall = walls[wallIdx % walls.length]
      wallIdx++
      const along = item.width * SCALE * item.scale
      const offset = wallOffsets[wall]
      // Alternate offsets outward (0, +, -, ++ …) to spread items along the wall.
      const signed = offset === 0 ? 0 : (offset % 2 === 1 ? 1 : -1) * Math.ceil(offset / 2) * along
      wallOffsets[wall]++
      return placeAgainstWall(item, room, wall, signed)
    }

    // Small/unspecified items: tuck against the nearest remaining wall slot.
    const wall = walls[wallIdx % walls.length]
    wallIdx++
    const along = item.width * SCALE * item.scale
    const offset = wallOffsets[wall]
    const signed = offset === 0 ? 0 : (offset % 2 === 1 ? 1 : -1) * Math.ceil(offset / 2) * along
    wallOffsets[wall]++
    return placeAgainstWall(item, room, wall, signed)
  })
}
